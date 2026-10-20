import type { CacheStore } from "./types";

export type LoaderFailure = {
  ok: false;
  status: number;
  body?: string;
  reason?: "upstream" | "budget";
  budgetRemaining?: number;
};

export type LoaderResult<T> =
  | { ok: true; value: T; budgetRemaining?: number }
  | LoaderFailure;

export type CachedResult<T> =
  | {
      ok: true;
      source: "hit" | "miss" | "stale";
      value: T;
      budgetRemaining?: number;
    }
  | LoaderFailure;

export interface CachedResourceOptions {
  ttlMs: number;
  staleTtlMs: number;
}

/**
 * Keys currently being fetched. Collapses concurrent cache misses into a single
 * upstream call (single-flight), which is what keeps bursts from burning quota.
 */
const inFlight = new Map<string, Promise<CachedResult<unknown>>>();

/**
 * Read-through cache with freshness, stale-on-error, and single-flight:
 * - fresh hit → no upstream call;
 * - miss/stale → `loader`; on success the entry is cached;
 * - loader failure → serve the stale entry if one exists, otherwise propagate.
 * Only successful values are stored; errors are never cached.
 */
export async function cachedResource<T>(
  store: CacheStore,
  key: string,
  options: CachedResourceOptions,
  loader: () => Promise<LoaderResult<T>>
): Promise<CachedResult<T>> {
  const lookup = await store.get<T>(key);

  if (lookup.state === "fresh") {
    return { ok: true, source: "hit", value: lookup.value };
  }

  const pending = inFlight.get(key) as Promise<CachedResult<T>> | undefined;
  if (pending) return pending;

  const run = (async (): Promise<CachedResult<T>> => {
    try {
      const result = await loader();

      if (result.ok) {
        await store.set(key, result.value, options);
        return {
          ok: true,
          source: "miss",
          value: result.value,
          budgetRemaining: result.budgetRemaining,
        };
      }

      if (lookup.state === "stale") {
        return {
          ok: true,
          source: "stale",
          value: lookup.value,
          budgetRemaining: result.budgetRemaining,
        };
      }

      return result;
    } catch {
      if (lookup.state === "stale") {
        return { ok: true, source: "stale", value: lookup.value };
      }
      return { ok: false, status: 502, reason: "upstream" };
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, run as Promise<CachedResult<unknown>>);
  return run;
}

/** Test helper: clear pending single-flight entries. */
export function resetInFlightForTests() {
  inFlight.clear();
}
