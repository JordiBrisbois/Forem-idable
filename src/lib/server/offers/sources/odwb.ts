import { z } from "zod";
import { appendOdwbApiKey } from "@/lib/odwbApiKey";
import { reserveOdwbCall } from "@/lib/server/cache/budget";
import { normalizeOffer } from "../normalize";
import type { NormalizedOffer } from "../normalize";
import { odwbOfferRecordSchema } from "../odwbRecord";
import { OffersSourceError, type OffersFetch } from "./types";

const ODWB_EXPORT_URL =
  "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/exports/json";

const EXPORT_TIMEOUT_MS = 120_000;

/**
 * Reads the whole dataset through the export endpoint.
 *
 * Paging `/records` cannot cover this dataset: Opendatasoft caps `offset` at
 * 10 000 while the dataset holds ~24 000 offers, so a page loop either stops
 * early or fails. One export call removes the limit, spends a single unit of
 * the shared quota instead of ~250, and cannot trip the per-minute burst guard.
 */
export const fetchAllOdwbOffers: OffersFetch = async (): Promise<{
  offers: NormalizedOffer[];
  total: number;
}> => {
  const budget = await reserveOdwbCall();
  if (!budget.allowed) {
    throw new OffersSourceError(`ODWB budget exhausted (${budget.reason ?? "unknown"})`, "budget");
  }

  const url = appendOdwbApiKey(new URL(ODWB_EXPORT_URL));
  url.searchParams.set("limit", "-1");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(EXPORT_TIMEOUT_MS),
    });
  } catch (error) {
    throw new OffersSourceError(
      `ODWB export failed: ${error instanceof Error ? error.message : "unknown"}`,
      "upstream"
    );
  }

  if (response.status === 429) {
    throw new OffersSourceError("ODWB rate limit reached", "rate-limited");
  }
  if (!response.ok) {
    throw new OffersSourceError(`ODWB returned ${response.status}`, "upstream");
  }

  const parsed = z.array(odwbOfferRecordSchema).safeParse(await response.json());
  if (!parsed.success) {
    throw new OffersSourceError("ODWB export did not match the expected shape", "upstream");
  }

  return {
    offers: parsed.data.map(normalizeOffer),
    total: parsed.data.length,
  };
};
