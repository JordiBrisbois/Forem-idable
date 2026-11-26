import { logServerEvent } from "@/lib/server/observability";
import {
  deleteOffersSyncedBefore,
  markSyncFailed,
  markSyncStarted,
  markSyncSucceeded,
  upsertOffers,
} from "./repository";
import { fetchAllOdwbOffers } from "./sources/odwb";
import type { OffersFetch } from "./sources/types";

export type { OffersFetch } from "./sources/types";

export interface SyncOptions {
  /** Injected in tests; defaults to the real ODWB export fetch. */
  fetchOffers?: OffersFetch;
}

export interface SyncResult {
  recordsSynced: number;
  removed: number;
}

/**
 * Replaces the local mirror with a fresh copy of the ODWB dataset.
 *
 * The dataset is read in one export call (Opendatasoft caps `/records` at an
 * offset of 10 000, below the dataset size), then upserted in chunks. Pruning
 * happens only after the whole snapshot has been written: a failed run must
 * never delete offers that simply were not fetched.
 */
export async function runOffersSync(options: SyncOptions = {}): Promise<SyncResult> {
  const fetchOffers = options.fetchOffers ?? fetchAllOdwbOffers;
  const startedAt = new Date();

  await markSyncStarted(startedAt);

  try {
    const { offers } = await fetchOffers();

    if (offers.length === 0) {
      throw new Error("ODWB export returned no offers");
    }

    const recordsSynced = await upsertOffers(offers, startedAt);
    const removed = await deleteOffersSyncedBefore(startedAt);

    await markSyncSucceeded(new Date(), recordsSynced);
    logServerEvent({
      category: "offers",
      action: "sync_succeeded",
      meta: { recordsSynced, removed },
    });

    return { recordsSynced, removed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    await markSyncFailed(new Date(), message);
    logServerEvent({ category: "offers", action: "sync_failed", level: "error", meta: { message } });
    throw error;
  }
}
