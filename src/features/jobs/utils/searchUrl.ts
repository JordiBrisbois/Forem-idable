import { LocationEntry } from "@/services/location/locationCache";
import { SearchQuery } from "@/types/search";

const LOCATION_TYPES = new Set([
  "Pays",
  "Régions",
  "Provinces",
  "Arrondissements",
  "Communes",
  "Localités",
]);

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

  return {
    keywords,
    locations,
    booleanMode,
  };
}
