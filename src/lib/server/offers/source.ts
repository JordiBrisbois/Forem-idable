import { appendOdwbApiKey } from "@/lib/odwbApiKey";
import { reserveOdwbCall } from "@/lib/server/cache/budget";
import { logServerEvent } from "@/lib/server/observability";
import { odwbRecordsResponseSchema, type OdwbOfferRecord } from "./odwbRecord";

const ODWB_RECORDS_URL =
  "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/records";

/** ODWB caps `/records` at 100 rows per call. */
export const ODWB_PAGE_SIZE = 100;

export class OffersSourceError extends Error {
  constructor(
    message: string,
    readonly kind: "rate-limited" | "budget" | "upstream"
  ) {
    super(message);
    this.name = "OffersSourceError";
  }
}

export interface OfferPage {
  records: OdwbOfferRecord[];
  total: number;
}

/** One page of the upstream dataset, charged against the shared ODWB budget. */
export async function fetchOffersPage(offset: number): Promise<OfferPage> {
  const budget = await reserveOdwbCall();
  if (!budget.allowed) {
    throw new OffersSourceError(
      `ODWB budget exhausted (${budget.reason ?? "unknown"})`,
      "budget"
    );
  }

  const url = appendOdwbApiKey(new URL(ODWB_RECORDS_URL));
  url.searchParams.set("limit", String(ODWB_PAGE_SIZE));
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
      meta: { offset },
    });
    throw new OffersSourceError("ODWB payload did not match the expected shape", "upstream");
  }

  return {
    records: parsed.data.results,
    total: parsed.data.total_count ?? 0,
  };
}
