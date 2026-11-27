import type { ContractType } from "@/lib/contractType";
import type { LocationEntry } from "@/services/location/locationCache";
import type { SearchGoal } from "@/types/preferences";
import type { SearchSort } from "@/types/search";

/**
 * Provider-agnostic search input. Each provider translates it into its own
 * query language: the mirror provider builds SQL, Adzuna builds query params.
 */
export interface JobSearchParams {
  keywords?: string[];
  locations?: LocationEntry[];
  limit?: number;
  offset?: number;
  booleanMode?: "AND" | "OR";
  goal?: SearchGoal;
  contractTypes?: ContractType[];
  regimes?: string[];
  sectors?: string[];
  languages?: string[];
  sort?: SearchSort;
}
