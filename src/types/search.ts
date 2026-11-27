import { z } from "zod";
import { LocationEntry } from "@/services/location/locationCache";
import { ContractType, contractTypeSchema } from "@/lib/contractType";
import { searchGoalSchema } from "@/types/preferences";

export type BooleanMode = "AND" | "OR";

export interface SearchQuery {
  keywords: string[];
  locations: LocationEntry[];
  booleanMode: BooleanMode;
  goal: "internship" | "job";
  /** Selected contract types; empty/undefined means "all contracts". */
  contractTypes?: ContractType[];
}

/** Result ordering the user can pick. */
export type SearchSort = "date" | "relevance";

/** Filters applied on top of the query, from the mirror's own values. */
export interface SearchFilters {
  /** Published work regime labels ("Temps plein", …). */
  regimes: string[];
  /** Lower-cased sector labels. */
  sectors: string[];
  /** Lower-cased language labels. */
  languages: string[];
}

export const PAGE_SIZES = [15, 25, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

/** Presentation state of a result set, shareable through the URL. */
export interface SearchView {
  sort: SearchSort;
  page: number;
  pageSize: PageSize;
  filters: SearchFilters;
}

export const DEFAULT_SEARCH_VIEW: SearchView = {
  sort: "date",
  page: 1,
  pageSize: 15,
  filters: { regimes: [], sectors: [], languages: [] },
};

export const booleanModeSchema = z.enum(["AND", "OR"]);

export const locationEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum([
    "Pays",
    "Régions",
    "Provinces",
    "Arrondissements",
    "Communes",
    "Localités",
  ]),
  parentId: z.string().optional(),
  code: z.string().optional(),
  level: z.number().optional(),
  postalCode: z.string().optional(),
});

export const searchQuerySchema = z.object({
  keywords: z.array(z.string().trim().min(1)).max(20),
  locations: z.array(locationEntrySchema).max(10),
  booleanMode: booleanModeSchema,
  goal: searchGoalSchema.default("job"),
  contractTypes: z.array(contractTypeSchema).max(9).default([]),
});
