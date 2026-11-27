import { and, desc, eq, or, sql, type SQL } from "drizzle-orm";
import type { ContractType } from "@/lib/contractType";
import type { OfferDetails } from "@/types/offerDetails";
import { ensureDatabase, orm } from "@/lib/server/db";
import { foremOfferDetails, foremOffers, foremOffersSyncState } from "@/lib/server/schema";
import type { Job } from "@/types/job";
import { buildOfferFilters, distanceKmSql, type OfferSearchCriteria } from "./filters";
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
      contractTypeRaw: foremOffers.contractTypeRaw,
      locationLabel: foremOffers.locationLabel,
      publicationDate: foremOffers.publicationDate,
      url: foremOffers.url,
      metier: foremOffers.metier,
      distanceKm: criteria.near
        ? distanceKmSql(criteria.near.lat, criteria.near.lon)
        : sql<number | null>`NULL`,
    })
    .from(foremOffers)
    .where(where)
    .orderBy(...orderClauses(criteria))
    .limit(criteria.limit)
    .offset(criteria.offset);

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(foremOffers)
    .where(where);

  return {
    jobs: rows.map((row) =>
      toJob({
        ...row,
        distanceKm: row.distanceKm === null ? null : Number(row.distanceKm),
      })
    ),
    total: countRow?.total ?? rows.length,
  };
}

/**
 * Ordering for a search:
 * 1. text relevance when asked and keywords exist (GIN-indexed tsvector);
 * 2. internship preference: stages and work-study contracts first, without
 *    hiding jobs (a student still sees a matching CDI);
 * 3. newest first, undated last, stable on the offer id.
 */
function orderClauses(criteria: OfferSearchCriteria): SQL[] {
  const clauses: SQL[] = [];
  const keywords = (criteria.keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean);

  if (criteria.sort === "relevance" && keywords.length > 0) {
    const query = criteria.booleanMode === "AND" ? keywords.join(" ") : keywords.join(" OR ");
    clauses.push(
      sql`ts_rank(to_tsvector('french', ${foremOffers.searchText}), websearch_to_tsquery('french', ${query})) DESC`
    );
  }

  if (criteria.near) {
    clauses.push(distanceKmSql(criteria.near.lat, criteria.near.lon));
  }

  if (criteria.goal === "internship") {
    clauses.push(
      sql`CASE WHEN ${foremOffers.contractType} IN ('STAGE', 'ALTERNANCE') THEN 0 ELSE 1 END`
    );
  }

  clauses.push(sql`${foremOffers.publicationDate} DESC NULLS LAST`, desc(foremOffers.offerId));
  return clauses;
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

export interface FacetValue {
  value: string;
  count: number;
}

export interface OfferFacets {
  regimes: FacetValue[];
  sectors: FacetValue[];
  languages: FacetValue[];
}

/**
 * Filter values actually present in the mirror, with counts, so the UI never
 * offers a filter that returns nothing. Computed locally: no upstream call.
 */
export async function getOfferFacets(limit = 20): Promise<OfferFacets> {
  const db = await database();

  const [regimeRows, sectorResult, languageResult] = await Promise.all([
    db
      .select({ value: foremOffers.regime, count: sql<number>`count(*)::int` })
      .from(foremOffers)
      .where(sql`${foremOffers.regime} IS NOT NULL AND ${foremOffers.regime} <> ''`)
      .groupBy(foremOffers.regime)
      .orderBy(desc(sql`count(*)`))
      .limit(limit),
    db.execute<{ value: string; count: number }>(
      sql`SELECT unnest(${foremOffers.sectors}) AS value, count(*)::int AS count
          FROM ${foremOffers}
          GROUP BY 1
          ORDER BY 2 DESC
          LIMIT ${limit}`
    ),
    db.execute<{ value: string; count: number }>(
      sql`SELECT unnest(${foremOffers.languages}) AS value, count(*)::int AS count
          FROM ${foremOffers}
          GROUP BY 1
          ORDER BY 2 DESC
          LIMIT ${limit}`
    ),
  ]);

  return {
    regimes: regimeRows
      .filter((row): row is { value: string; count: number } => Boolean(row.value))
      .map((row) => ({ value: row.value, count: row.count })),
    sectors: sectorResult.rows.map((row) => ({ value: row.value, count: Number(row.count) })),
    languages: languageResult.rows.map((row) => ({ value: row.value, count: Number(row.count) })),
  };
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
          regime: offer.regime,
          sectors: offer.sectors,
          languages: offer.languages,
          latitude: offer.latitude,
          longitude: offer.longitude,
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
          regime: sql`excluded.regime`,
          sectors: sql`excluded.sectors`,
          languages: sql`excluded.languages`,
          latitude: sql`excluded.latitude`,
          longitude: sql`excluded.longitude`,
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

/**
 * True when the mirror was filled by a *successful* sync recently.
 *
 * Deliberately not based on the newest row: a partially written mirror is not
 * stale by that measure, so an interrupted run would be trusted for a full
 * cycle. Only a recorded success counts.
 */
export async function isMirrorFresh(maxAgeMs: number): Promise<boolean> {
  const state = await getSyncState();
  if (!state || state.status !== "success" || !state.finishedAt) return false;

  const finishedAt =
    state.finishedAt instanceof Date ? state.finishedAt : new Date(state.finishedAt);
  const finishedMs = finishedAt.getTime();

  return Number.isFinite(finishedMs) && Date.now() - finishedMs < maxAgeMs;
}


export interface MirrorStatus {
  offers: number;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  ageMinutes: number | null;
  stale: boolean;
}

/** Freshness of the mirror, for the "données mises à jour il y a X" badge. */
export async function getMirrorStatus(maxAgeMs: number): Promise<MirrorStatus> {
  const [offers, state] = await Promise.all([countOffers(), getSyncState()]);
  const lastSyncAt = state?.finishedAt ? new Date(state.finishedAt) : null;
  const ageMinutes = lastSyncAt
    ? Math.max(0, Math.round((Date.now() - lastSyncAt.getTime()) / 60000))
    : null;

  return {
    offers,
    lastSyncAt: lastSyncAt ? lastSyncAt.toISOString() : null,
    lastSyncStatus: state?.status ?? null,
    ageMinutes,
    stale: state?.status !== "success" || (ageMinutes ?? Infinity) * 60000 > maxAgeMs,
  };
}

/** Offers ingested after `since`, i.e. what is new for a given visitor. */
export async function countOffersFirstSeenSince(since: Date): Promise<number> {
  const db = await database();
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(foremOffers)
    .where(sql`${foremOffers.firstSeenAt} > ${since}`);
  return row?.total ?? 0;
}

export interface LocationCentroid {
  lat: number;
  lon: number;
  offers: number;
}

/**
 * Average position of the mirrored offers in a place.
 *
 * Used by "around me" when the visitor already typed a location: centring on
 * the place they asked for is what they mean, and it needs no geocoding service
 * (the coordinates come from the offers themselves).
 */
export async function getLocationCentroid(input: {
  postalCode?: string;
  name?: string;
}): Promise<LocationCentroid | null> {
  const conditions = [];

  if (input.postalCode) {
    conditions.push(sql`${foremOffers.postalCodes} && ARRAY[${input.postalCode}]::text[]`);
  }
  if (input.name) {
    conditions.push(sql`${foremOffers.locationLabel} ILIKE ${input.name}`);
  }

  if (conditions.length === 0) return null;

  const db = await database();
  const [row] = await db
    .select({
      lat: sql<number | null>`avg(${foremOffers.latitude})`,
      lon: sql<number | null>`avg(${foremOffers.longitude})`,
      offers: sql<number>`count(*)::int`,
    })
    .from(foremOffers)
    .where(
      and(
        or(...conditions),
        sql`${foremOffers.latitude} IS NOT NULL`,
        sql`${foremOffers.longitude} IS NOT NULL`
      )
    );

  if (!row || !row.lat || !row.lon || row.offers === 0) return null;

  return { lat: Number(row.lat), lon: Number(row.lon), offers: row.offers };
}
/** Cached, normalised detail of one offer, if it is still fresh. */
export async function getCachedOfferDetail(
  offerId: string,
  maxAgeMs: number
): Promise<OfferDetails | null> {
  const db = await database();
  const [row] = await db
    .select({ detail: foremOfferDetails.detail, fetchedAt: foremOfferDetails.fetchedAt })
    .from(foremOfferDetails)
    .where(eq(foremOfferDetails.offerId, offerId));

  if (!row) return null;
  if (Date.now() - new Date(row.fetchedAt).getTime() > maxAgeMs) return null;

  return row.detail as OfferDetails;
}

/** Stores the detail fetched from Forem (upsert: a refresh replaces it). */
export async function saveOfferDetail(offerId: string, detail: OfferDetails): Promise<void> {
  const db = await database();
  await db
    .insert(foremOfferDetails)
    .values({ offerId, detail, fetchedAt: new Date() })
    .onConflictDoUpdate({
      target: foremOfferDetails.offerId,
      set: { detail, fetchedAt: new Date() },
    });
}