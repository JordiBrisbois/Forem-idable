import { LocationEntry } from "@/services/location/locationCache";
import { CONTRACT_TYPES, ContractType } from "@/lib/contractType";
import { SearchQuery } from "@/types/search";
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

function parseContractTypes(raw: string | null): ContractType[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is ContractType => CONTRACT_TYPE_VALUES.has(value));
}

type SearchParamsLike = Pick<URLSearchParams, "get" | "getAll">;

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

export function toSearchParams(query: SearchQuery): URLSearchParams {
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

  return params;
}

export function toSearchPath(pathname: string, query: SearchQuery): string {
  const params = toSearchParams(query);
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function fromSearchParams(params: SearchParamsLike): SearchQuery | null {
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

  let locations: LocationEntry[] = [];
  const rawLocations = params.get("loc");
  if (rawLocations) {
    try {
      const parsed = JSON.parse(rawLocations);
      if (Array.isArray(parsed)) {
        locations = parsed
          .filter((item) =>
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
      }
    } catch {
      locations = [];
    }
  }

  if (keywords.length === 0 && locations.length === 0) return null;

  const contractTypes = parseContractTypes(params.get("ct"));

  const query: SearchQuery = {
    keywords,
    locations,
    booleanMode,
    goal,
  };

  if (contractTypes.length > 0) {
    query.contractTypes = contractTypes;
  }

  return query;
}
