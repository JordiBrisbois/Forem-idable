import { resetInFlightForTests } from "./cached";
import { LayeredCacheStore } from "./layered";
import { MemoryCacheStore } from "./memory";
import { RedisCacheStore } from "./redis";
import type { CacheStore } from "./types";

const MEMORY_MAX_ENTRIES = 500;

function positiveIntFromEnv(name: string, fallbackSeconds: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallbackSeconds;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallbackSeconds;
}

export interface OffersCacheOptions {
  page: { ttlMs: number; staleTtlMs: number };
  facets: { ttlMs: number; staleTtlMs: number };
}

/**
 * TTLs sized against the ODWB quota (50k calls/day, domain-wide):
 * - search pages: 30 min fresh (≤ 48 calls/day per distinct query), 24h stale;
 * - facets: 12h fresh (near-static), 48h stale;
 * - the client keeps its own 60s cache.
 * All are env-overridable.
 */
export function getOffersCacheOptions(): OffersCacheOptions {
  const pageTtlMs = positiveIntFromEnv("OFFERS_CACHE_TTL_SECONDS", 1800) * 1000;
  const pageStaleTtlMs = Math.max(
    positiveIntFromEnv("OFFERS_CACHE_STALE_SECONDS", 86400) * 1000,
    pageTtlMs
  );
  const facetsTtlMs = positiveIntFromEnv("OFFERS_FACETS_TTL_SECONDS", 12 * 3600) * 1000;
  const facetsStaleTtlMs = Math.max(
    positiveIntFromEnv("OFFERS_FACETS_STALE_SECONDS", 48 * 3600) * 1000,
    facetsTtlMs
  );

  return {
    page: { ttlMs: pageTtlMs, staleTtlMs: pageStaleTtlMs },
    facets: { ttlMs: facetsTtlMs, staleTtlMs: facetsStaleTtlMs },
  };
}

let store: CacheStore | null = null;

/** L1 memory + (optional) L2 Redis. Redis is a no-op when not configured. */
export function getOffersCacheStore(): CacheStore {
  if (!store) {
    const namespace = `${process.env.APP_STORAGE_NAMESPACE?.trim() || "app"}:cache:offers`;
    store = new LayeredCacheStore([
      new MemoryCacheStore(MEMORY_MAX_ENTRIES),
      new RedisCacheStore(namespace),
    ]);
  }
  return store;
}

/** Test helper: drop the store (memory is recreated) and pending flights. */
export async function resetCachesForTests(): Promise<void> {
  if (store) {
    await store.clear();
  }
  store = null;
  resetInFlightForTests();
}
