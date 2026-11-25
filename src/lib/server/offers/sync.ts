import { logServerEvent } from "@/lib/server/observability";
import {
  deleteOffersSyncedBefore,
  markSyncFailed,
  markSyncStarted,
  markSyncSucceeded,
  upsertOffers,
} from "./repository";
import { fetchOdwbPage } from "./sources/odwb";
import { isLastPage, PAGE_SIZE, type OfferPageFetcher } from "./sources/types";

export type { OfferPageFetcher } from "./sources/types";

export interface SyncOptions {
  /** Injected in tests; defaults to the real ODWB page fetch. */
  fetchPage?: OfferPageFetcher;
  /** Safety net: the dataset fits in ~250 pages today. */
  maxPages?: number;
}

export interface SyncResult {
  recordsSynced: number;
  pagesFetched: number;
  removed: number;
}

const DEFAULT_MAX_PAGES = 400;

/**
 * Mirrors the whole ODWB dataset into `forem_offers`.
 *
 * The sync is incremental by nature (upsert on `offer_id`) but only prunes rows
 * after a *complete* pass: a partially failed run must never delete offers that
 * were simply not reached yet.
 */
export async function runOffersSync(options: SyncOptions = {}): Promise<SyncResult> {
  const fetchPage = options.fetchPage ?? fetchOdwbPage;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const startedAt = new Date();

  await markSyncStarted(startedAt);

  let recordsSynced = 0;
  let pagesFetched = 0;
  let finished = false;

  try {
    for (let page = 0; page < maxPages; page += 1) {
      const offset = page * PAGE_SIZE;
      const { offers, total } = await fetchPage(offset);

      if (offers.length === 0) {
        finished = true;
        break;
      }

      recordsSynced += await upsertOffers(offers, startedAt);
      pagesFetched += 1;

      if (isLastPage(offset, offers.length, total)) {
        finished = true;
        break;
      }
    }

    // Pruning is only safe when the upstream pass reached the end.
    const removed = finished ? await deleteOffersSyncedBefore(startedAt) : 0;

    await markSyncSucceeded(new Date(), recordsSynced);
    logServerEvent({
      category: "offers",
      action: "sync_succeeded",
      meta: { recordsSynced, pagesFetched, removed, finished },
    });

    return { recordsSynced, pagesFetched, removed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    await markSyncFailed(new Date(), message);
    logServerEvent({ category: "offers", action: "sync_failed", level: "error", meta: { message } });
    throw error;
  }
}
