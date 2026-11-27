import { LocationEntry } from "@/services/location/locationCache";
import { CONTRACT_TYPES, ContractType } from "@/lib/contractType";
import {
  DEFAULT_SEARCH_VIEW,
  PAGE_SIZES,
  PageSize,
  SearchFilters,
  SearchQuery,
  SearchSort,
  SearchView,
} from "@/types/search";
import { SearchGoal } from "@/types/preferences";
import { runtimeConfig } from "@/config/runtime";

const LOCATION_TYPES = new Set([
  "Pays",
  "Régions",
  "Provinces",
  "Arrondissements",
  "Communes",
  "Localités",
]);

const CONTRACT_TYPE_VALUES = new Set<string>(CONTRACT_TYPES);
const PAGE_SIZE_VALUES = new Set<number>(PAGE_SIZES);

function parseContractTypes(raw: string | null): ContractType[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is ContractType => CONTRACT_TYPE_VALUES.has(value));
}

type SearchParamsLike = Pick<URLSearchParams, "get" | "getAll">;

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function parsePageSize(raw: string | null): PageSize {
  const parsed = Number(raw);
  return PAGE_SIZE_VALUES.has(parsed)
    ? (parsed as PageSize)
    : DEFAULT_SEARCH_VIEW.pageSize;
}

function parsePage(raw: string | null): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 1000) : 1;
}

function parseSort(raw: string | null): SearchSort {
  return raw === "relevance" ? "relevance" : "date";
}

function normalizeLocations(locations: LocationEntry[]): LocationEntry[] {
  return locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    type: loc.type,
    code: loc.code,
    level: loc.level,
    postalCode: loc.postalCode,
    parentId: loc.parentId,
  }));
}

/** Serialises a search, including the result view so a link is reproducible. */
export function toSearchParams(query: SearchQuery, view?: SearchView): URLSearchParams {
  const params = new URLSearchParams();

  query.keywords
    .map((kw) => kw.trim())
    .filter(Boolean)
    .forEach((kw) => params.append("kw", kw));

  params.set("bm", query.booleanMode);
  params.set("goal", query.goal);

  if (query.contractTypes && query.contractTypes.length > 0) {
    params.set("ct", query.contractTypes.join(","));
  }

  if (query.locations.length > 0) {
    params.set("loc", JSON.stringify(normalizeLocations(query.locations)));
  }

  if (view) {
    if (view.sort !== DEFAULT_SEARCH_VIEW.sort) params.set("tri", view.sort);
    if (view.page > 1) params.set("page", String(view.page));
    if (view.pageSize !== DEFAULT_SEARCH_VIEW.pageSize) {
      params.set("taille", String(view.pageSize));
    }
    if (view.filters.regimes.length > 0) {
      params.set("regime", view.filters.regimes.join(","));
    }
    if (view.filters.sectors.length > 0) {
      params.set("secteur", view.filters.sectors.join(","));
    }
    if (view.filters.languages.length > 0) {
      params.set("langue", view.filters.languages.join(","));
    }
  }

  return params;
}

export function toSearchPath(pathname: string, query: SearchQuery, view?: SearchView): string {
  const params = toSearchParams(query, view);
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function parseLocations(params: SearchParamsLike): LocationEntry[] {
  const rawLocations = params.get("loc");
  if (!rawLocations) return [];

  try {
    const parsed = JSON.parse(rawLocations);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.type === "string" &&
          LOCATION_TYPES.has(item.type)
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        code: typeof item.code === "string" ? item.code : undefined,
        level: typeof item.level === "number" ? item.level : undefined,
        postalCode: typeof item.postalCode === "string" ? item.postalCode : undefined,
        parentId: typeof item.parentId === "string" ? item.parentId : undefined,
      }));
  } catch {
    return [];
  }
}

/** Query and view from a URL; `query` is null when the URL holds no search. */
export function parseSearchLocation(params: SearchParamsLike): {
  query: SearchQuery | null;
  view: SearchView;
} {
  const keywords = params
    .getAll("kw")
    .map((kw) => kw.trim())
    .filter(Boolean);

  const booleanMode = params.get("bm") === "AND" ? "AND" : "OR";
  const rawGoal = params.get("goal");
  const goal: SearchGoal =
    rawGoal === "internship" || rawGoal === "job"
      ? rawGoal
      : runtimeConfig.defaults.searchGoal;

  const locations = parseLocations(params);
  const view = parseSearchView(params);

  if (keywords.length === 0 && locations.length === 0) {
    return { query: null, view };
  }

  const contractTypes = parseContractTypes(params.get("ct"));
  const query: SearchQuery = { keywords, locations, booleanMode, goal };
  if (contractTypes.length > 0) {
    query.contractTypes = contractTypes;
  }

  return { query, view };
}

export function parseSearchView(params: SearchParamsLike): SearchView {
  const filters: SearchFilters = {
    regimes: parseList(params.get("regime")),
    sectors: parseList(params.get("secteur")),
    languages: parseList(params.get("langue")),
  };

  return {
    sort: parseSort(params.get("tri")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("taille")),
    filters,
  };
}

/** Backwards-compatible query-only parser. */
export function fromSearchParams(params: SearchParamsLike): SearchQuery | null {
  return parseSearchLocation(params).query;
}
