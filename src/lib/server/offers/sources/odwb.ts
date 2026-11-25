import { appendOdwbApiKey } from "@/lib/odwbApiKey";
import { reserveOdwbCall } from "@/lib/server/cache/budget";
import { logServerEvent } from "@/lib/server/observability";
import { normalizeOffer } from "../normalize";
import { odwbRecordsResponseSchema } from "../odwbRecord";
import {
  OffersSourceError,
  PAGE_SIZE,
  type OfferPage,
  type OfferPageFetcher,
} from "./types";

const ODWB_RECORDS_URL =
  "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/records";

/**
 * Primary source: the ODWB (Opendatasoft) dataset, authenticated with the
 * workspace key.
 *
 * The dataset carries a daily call cap shared by every consumer, so this source
 * can legitimately answer 429 through no fault of the instance — the sync then
 * falls back to the Forem API (see `index.ts`).
 */
export const fetchOdwbPage: OfferPageFetcher = async (offset: number): Promise<OfferPage> => {
  const budget = await reserveOdwbCall();
  if (!budget.allowed) {
    throw new OffersSourceError(
      `ODWB budget exhausted (${budget.reason ?? "unknown"})`,
      "budget"
    );
  }

  const url = appendOdwbApiKey(new URL(ODWB_RECORDS_URL));
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("order_by", "datedebutdiffusion desc");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new OffersSourceError(
      `ODWB request failed: ${error instanceof Error ? error.message : "unknown"}`,
      "upstream"
    );
  }

  if (response.status === 429) {
    throw new OffersSourceError("ODWB rate limit reached", "rate-limited");
  }
  if (!response.ok) {
    throw new OffersSourceError(`ODWB returned ${response.status}`, "upstream");
  }

  const parsed = odwbRecordsResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    logServerEvent({
      category: "offers",
      action: "sync_payload_invalid",
      level: "error",
      meta: { offset, source: "odwb" },
    });
    throw new OffersSourceError("ODWB payload did not match the expected shape", "upstream");
  }

  return {
    offers: parsed.data.results.map(normalizeOffer),
    total: parsed.data.total_count ?? 0,
  };
};
