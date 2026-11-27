import type { Job } from "@/types/job";
import type { JobSearchParams } from "@/services/jobs/searchParams";

/** Failure reasons a caller can act on, instead of a single opaque error. */
export type OffersFailureReason = "rate_limited" | "unavailable" | "invalid" | "indexing";

export class OffersUnavailableError extends Error {
  constructor(readonly reason: OffersFailureReason) {
    super(`Offers search failed: ${reason}`);
    this.name = "OffersUnavailableError";
  }
}

export interface OffersSearchResult {
  jobs: Job[];
  total: number;
}

/**
 * Browser-side client for the local offers mirror. It posts the structured
 * criteria (keywords, contract types, locations) and lets the server build the
 * SQL — no query language leaks into the client.
 */
export async function searchOffers(params: JobSearchParams): Promise<OffersSearchResult> {
  let response: Response;
  try {
    response = await fetch("/api/offers/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords: params.keywords,
        booleanMode: params.booleanMode,
        contractTypes: params.contractTypes,
        locations: params.locations,
        regimes: params.regimes,
        sectors: params.sectors,
        languages: params.languages,
        sort: params.sort,
        goal: params.goal,
        limit: params.limit,
        offset: params.offset,
      }),
    });
  } catch {
    throw new OffersUnavailableError("unavailable");
  }

  if (response.status === 429) {
    throw new OffersUnavailableError("rate_limited");
  }
  if (response.status === 400) {
    throw new OffersUnavailableError("invalid");
  }
  if (!response.ok) {
    throw new OffersUnavailableError("unavailable");
  }

  const payload = (await response.json()) as OffersSearchResult & { indexing?: boolean };

  if (payload.indexing) {
    throw new OffersUnavailableError("indexing");
  }

  return {
    jobs: Array.isArray(payload.jobs) ? payload.jobs : [],
    total: typeof payload.total === "number" ? payload.total : 0,
  };
}
