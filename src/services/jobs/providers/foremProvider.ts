import { searchOffers } from "@/services/api/offersClient";
import type { JobSearchParams } from "@/services/jobs/searchParams";
import type { JobProvider } from "./types";

/**
 * Forem provider: reads the local mirror maintained by the offers sync worker.
 * It used to hit ODWB on every search, which tied the search feature to a shared
 * 10 000 calls/day quota that any consumer could exhaust.
 */
export const foremProvider: JobProvider = {
  id: "forem",
  search: (params: JobSearchParams) => searchOffers(params),
};
