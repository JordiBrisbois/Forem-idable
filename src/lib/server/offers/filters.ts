import { and, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import type { ContractType } from "@/lib/contractType";
import type { LocationCategory } from "@/services/location/locationCache";
import { foremOffers } from "@/lib/server/schema";
import { normalizeSearchText, searchTokens } from "./text";

/** Minimal location shape the search needs; matches the client `LocationEntry`. */
export interface LocationFilter {
  id?: string;
  name: string;
  type: LocationCategory;
  postalCode?: string;
  code?: string;
}

export interface OfferSearchCriteria {
  keywords?: string[];
  booleanMode?: "AND" | "OR";
  contractTypes?: ContractType[];
  locations?: LocationFilter[];
  /** Work regime labels, as published ("Temps plein", …). */
  regimes?: string[];
  /** Lower-cased sector labels. */
  sectors?: string[];
  /** Lower-cased language labels ("francais", "fr", …). */
  languages?: string[];
  sort?: "date" | "relevance";
  /** Only offers ingested after this instant (used by the alert digest). */
  firstSeenAfter?: Date;
  /** Beneficiary preference: stages lead when searching for an internship. */
  goal?: "job" | "internship";
  limit: number;
  offset: number;
}

/** `%`, `_` and `\` are LIKE metacharacters; a keyword must match literally. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

/** Strips a leading postal code ("5000 Namur" → "namur") and normalises it. */
function normalizeLabel(value: string): string {
  return normalizeSearchText(value.replace(/^\d{4}\s+/, ""));
}

/**
 * Builds a PostgreSQL array literal (`{"a","b"}`).
 *
 * Drizzle binds a JS array as a *list* of parameters, which cannot be cast to
 * `text[]` (`($1,$2)::text[]` is invalid SQL). Passing one text parameter and
 * casting it works for any cardinality; quotes and backslashes are escaped so a
 * locality name can never break out of the literal.
 */
export function toPostgresArrayLiteral(values: string[]): string {
  const escaped = values.map(
    (value) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
  );
  return `{${escaped.join(",")}}`;
}

function likeAll(values: string[]): SQL {
  return or(
    ...values.map((value) =>
      ilike(foremOffers.searchText, `%${escapeLikePattern(value)}%`)
    )
  ) as SQL;
}

/**
 * The UI says "Wallonie", the dataset says "RÉGION WALLONNE": matching the
 * region column needs the dataset's spelling, otherwise the filter returns only
 * the rows that happen to contain the word elsewhere.
 */
export function datasetRegionLabel(label: string): string {
  const normalized = normalizeSearchText(label);

  if (normalized.includes("wallon")) return "wallonne";
  if (normalized.includes("flandr")) return "flamande";
  if (normalized.includes("bruxelles")) return "bruxelles";

  return normalized;
}

function keywordCondition(keywords: string[], mode: "AND" | "OR"): SQL | undefined {
  // A typed phrase ("développeur react") is split into tokens that must all
  // match, the way the ODS `search()` it replaces behaved.
  const phrases = keywords
    .map((keyword) => searchTokens(keyword))
    .filter((tokens) => tokens.length > 0);

  if (phrases.length === 0) return undefined;

  const phraseConditions = phrases.map(
    (tokens) =>
      and(
        ...tokens.map((token) =>
          ilike(foremOffers.searchText, `%${escapeLikePattern(token)}%`)
        )
      ) as SQL
  );

  return (mode === "AND" ? and(...phraseConditions) : or(...phraseConditions)) as SQL;
}

function contractCondition(contractTypes: ContractType[]): SQL | undefined {
  if (contractTypes.length === 0) return undefined;
  return inArray(foremOffers.contractType, contractTypes);
}

/**
 * Postal codes and localities are stored as `text[]`, so the natural match is
 * array overlap (`&&`); the text haystack is a last resort for entries whose
 * locality label is stored with a different spelling upstream.
 */
function placeCondition(localities: string[], postalCodes: string[]): SQL | undefined {
  const clauses: SQL[] = [];

  if (postalCodes.length > 0) {
    clauses.push(sql`${foremOffers.postalCodes} && ${toPostgresArrayLiteral(postalCodes)}::text[]`);
  }
  if (localities.length > 0) {
    clauses.push(sql`${foremOffers.localities} && ${toPostgresArrayLiteral(localities)}::text[]`);
    clauses.push(likeAll(localities));
  }

  if (clauses.length === 0) return undefined;
  return or(...clauses) as SQL;
}

function locationCondition(location: LocationFilter): SQL | undefined {
  const label = normalizeLabel(location.name);

  switch (location.type) {
    case "Pays":
      // Country-wide: no restriction at all.
      return undefined;

    case "Régions": {
      const regionLabel = datasetRegionLabel(label);
      return or(
        ilike(foremOffers.region, `%${escapeLikePattern(regionLabel)}%`),
        likeAll([regionLabel])
      ) as SQL;
    }

    case "Provinces": {
      const withoutPrefix = label.replace(/^province\s+(de\s+|d')?/, "");
      return or(
        ilike(foremOffers.region, `%${escapeLikePattern(withoutPrefix)}%`),
        likeAll([withoutPrefix])
      ) as SQL;
    }

    case "Arrondissements": {
      const withoutPrefix = label.replace(/^arrondissement\s+(de\s+|d')?/, "");
      return likeAll([withoutPrefix]);
    }

    case "Communes":
    case "Localités": {
      const postalCode = location.postalCode || location.name.match(/^(\d{4})\s+/)?.[1];
      return placeCondition([label], postalCode ? [postalCode] : []);
    }

    default:
      return likeAll([label]);
  }
}

/** Builds the WHERE clause for a search. Undefined means "no restriction". */
export function buildOfferFilters(criteria: OfferSearchCriteria): SQL | undefined {
  const clauses: SQL[] = [];

  const keywords = keywordCondition(criteria.keywords ?? [], criteria.booleanMode ?? "OR");
  if (keywords) clauses.push(keywords);

  const contracts = contractCondition(criteria.contractTypes ?? []);
  if (contracts) clauses.push(contracts);

  if (criteria.regimes && criteria.regimes.length > 0) {
    clauses.push(inArray(foremOffers.regime, criteria.regimes));
  }

  if (criteria.sectors && criteria.sectors.length > 0) {
    clauses.push(
      sql`${foremOffers.sectors} && ${toPostgresArrayLiteral(criteria.sectors)}::text[]`
    );
  }

  if (criteria.firstSeenAfter) {
    clauses.push(sql`${foremOffers.firstSeenAt} > ${criteria.firstSeenAfter}`);
  }

  if (criteria.languages && criteria.languages.length > 0) {
    clauses.push(
      sql`${foremOffers.languages} && ${toPostgresArrayLiteral(criteria.languages)}::text[]`
    );
  }

  // A "Pays" entry yields no clause (no restriction), and a search restricted
  // to a country alone must not OR an empty list into a false condition.
  const locations = (criteria.locations ?? [])
    .map((location) => locationCondition(location))
    .filter((clause): clause is SQL => clause !== undefined);

  if (locations.length > 0) {
    clauses.push(or(...locations) as SQL);
  }

  if (clauses.length === 0) return undefined;
  return and(...clauses) as SQL;
}
