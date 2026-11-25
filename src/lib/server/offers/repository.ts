import { desc, eq, sql } from "drizzle-orm";
import type { ContractType } from "@/lib/contractType";
import { ensureDatabase, orm } from "@/lib/server/db";
import { foremOffers, foremOffersSyncState } from "@/lib/server/schema";
import type { Job } from "@/types/job";
import { buildOfferFilters, type OfferSearchCriteria } from "./filters";
import { toJob, type NormalizedOffer } from "./normalize";

const SYNC_STATE_ID = "forem-offers";
const UPSERT_CHUNK_SIZE = 500;

async function database() {
  await ensureDatabase();
  if (!orm) {
    throw new Error("Database unavailable");
  }
  return orm;
}

export interface OfferSearchResult {
  jobs: Job[];
  total: number;
}

/** Reads a page of mirrored offers. Never calls the upstream API. */
export async function searchOffers(criteria: OfferSearchCriteria): Promise<OfferSearchResult> {
  const db = await database();
  const where = buildOfferFilters(criteria);

  const rows = await db
    .select({
      offerId: foremOffers.offerId,
      title: foremOffers.title,
      company: foremOffers.company,
      contractType: foremOffers.contractType,
      locationLabel: foremOffers.locationLabel,
      publicationDate: foremOffers.publicationDate,
      url: foremOffers.url,
      metier: foremOffers.metier,
    })
    .from(foremOffers)
    .where(where)
    .orderBy(sql`${foremOffers.publicationDate} DESC NULLS LAST`, desc(foremOffers.offerId))
    .limit(criteria.limit)
    .offset(criteria.offset);

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(foremOffers)
    .where(where);

  return {
    jobs: rows.map(toJob),
    total: countRow?.total ?? rows.length,
  };
}

/** Full upstream payload of one offer, for the details view. */
export async function getOfferPayload(offerId: string): Promise<Record<string, unknown> | null> {
  const db = await database();
  const [row] = await db
    .select({ payload: foremOffers.payload })
    .from(foremOffers)
    .where(eq(foremOffers.offerId, offerId))
    .limit(1);

  const payload = row?.payload;
  return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
}

/** One mirrored offer in the search-result shape (used by shared-message previews). */
export async function getOfferJob(offerId: string): Promise<Job | null> {
  const db = await database();
  const [row] = await db
    .select({
      offerId: foremOffers.offerId,
      title: foremOffers.title,
      company: foremOffers.company,
      contractType: foremOffers.contractType,
      locationLabel: foremOffers.locationLabel,
      publicationDate: foremOffers.publicationDate,
      url: foremOffers.url,
      metier: foremOffers.metier,
    })
    .from(foremOffers)
    .where(eq(foremOffers.offerId, offerId))
    .limit(1);

  return row ? toJob(row) : null;
}

/** Contract types present in the mirror, with counts — feeds the search filter. */
export async function countOffersByContractType(): Promise<Array<{ type: ContractType; count: number }>> {
  const db = await database();
  const rows = await db
    .select({ type: foremOffers.contractType, count: sql<number>`count(*)::int` })
    .from(foremOffers)
    .groupBy(foremOffers.contractType);

  return rows
    .filter((row): row is { type: ContractType; count: number } => row.type !== "AUTRE")
    .sort((left, right) => right.count - left.count);
}

export async function countOffers(): Promise<number> {
  const db = await database();
  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(foremOffers);
  return row?.total ?? 0;
}

/** Inserts or refreshes offers. Returns the number of rows written. */
export async function upsertOffers(offers: NormalizedOffer[], syncedAt: Date): Promise<number> {
  if (offers.length === 0) return 0;
  const db = await database();
  let written = 0;

  for (let index = 0; index < offers.length; index += UPSERT_CHUNK_SIZE) {
    const chunk = offers.slice(index, index + UPSERT_CHUNK_SIZE);

    await db
      .insert(foremOffers)
      .values(
        chunk.map((offer) => ({
          offerId: offer.offerId,
          title: offer.title,
          company: offer.company,
          contractType: offer.contractType,
          contractTypeRaw: offer.contractTypeRaw,
          region: offer.region,
          localities: offer.localities,
          postalCodes: offer.postalCodes,
          locationLabel: offer.locationLabel,
          metier: offer.metier,
          publicationDate: offer.publicationDate,
          url: offer.url,
          searchText: offer.searchText,
          payload: offer.payload,
          sourceSyncedAt: syncedAt,
          updatedAt: syncedAt,
        }))
      )
      .onConflictDoUpdate({
        target: foremOffers.offerId,
        set: {
          title: sql`excluded.title`,
          company: sql`excluded.company`,
          contractType: sql`excluded.contract_type`,
          contractTypeRaw: sql`excluded.contract_type_raw`,
          region: sql`excluded.region`,
          localities: sql`excluded.localities`,
          postalCodes: sql`excluded.postal_codes`,
          locationLabel: sql`excluded.location_label`,
          metier: sql`excluded.metier`,
          publicationDate: sql`excluded.publication_date`,
          url: sql`excluded.url`,
          searchText: sql`excluded.search_text`,
          payload: sql`excluded.payload`,
          sourceSyncedAt: sql`excluded.source_synced_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    written += chunk.length;
  }

  return written;
}

/** Drops offers that disappeared upstream. Only safe after a complete pass. */
export async function deleteOffersSyncedBefore(cutoff: Date): Promise<number> {
  const db = await database();
  const deleted = await db
    .delete(foremOffers)
    .where(sql`${foremOffers.sourceSyncedAt} < ${cutoff}`)
    .returning({ offerId: foremOffers.offerId });

  return deleted.length;
}

export interface SyncState {
  startedAt: Date;
  finishedAt: Date | null;
  status: "running" | "success" | "failed";
  recordsSynced: number;
  errorMessage: string | null;
}

export async function markSyncStarted(startedAt: Date): Promise<void> {
  const db = await database();
  await db
    .insert(foremOffersSyncState)
    .values({ id: SYNC_STATE_ID, startedAt, status: "running", recordsSynced: 0 })
    .onConflictDoUpdate({
      target: foremOffersSyncState.id,
      set: {
        startedAt,
        finishedAt: null,
        status: "running",
        recordsSynced: 0,
        errorMessage: null,
      },
    });
}

export async function markSyncSucceeded(finishedAt: Date, recordsSynced: number): Promise<void> {
  const db = await database();
  await db
    .update(foremOffersSyncState)
    .set({ finishedAt, status: "success", recordsSynced, errorMessage: null })
    .where(eq(foremOffersSyncState.id, SYNC_STATE_ID));
}

export async function markSyncFailed(finishedAt: Date, errorMessage: string): Promise<void> {
  const db = await database();
  await db
    .update(foremOffersSyncState)
    .set({ finishedAt, status: "failed", errorMessage })
    .where(eq(foremOffersSyncState.id, SYNC_STATE_ID));
}

export async function getSyncState(): Promise<SyncState | null> {
  const db = await database();
  const [row] = await db
    .select()
    .from(foremOffersSyncState)
    .where(eq(foremOffersSyncState.id, SYNC_STATE_ID))
    .limit(1);

  if (!row) return null;

  return {
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    status: row.status as SyncState["status"],
    recordsSynced: row.recordsSynced,
    errorMessage: row.errorMessage,
  };
}

/** True when the mirror is empty and a first sync has to run. */
export async function needsInitialSync(): Promise<boolean> {
  return (await countOffers()) === 0;
}

