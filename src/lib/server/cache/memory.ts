import type { CacheLookup, CacheStore, CacheWriteOptions } from "./types";

interface MemoryEntry {
  value: unknown;
  freshUntil: number;
  staleUntil: number;
}

/**
 * L1 cache: bounded, in-process, LRU-ish (reads re-insert to the end).
 * Entries are kept until `staleUntil` so a failed upstream can still be served.
 */
export class MemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, MemoryEntry>();

  constructor(private readonly maxEntries = 500) {}

  async get<T>(key: string): Promise<CacheLookup<T>> {
    const entry = this.entries.get(key);
    if (!entry) return { state: "miss" };

    const now = Date.now();
    if (now > entry.staleUntil) {
      this.entries.delete(key);
      return { state: "miss" };
    }

    // Refresh recency.
    this.entries.delete(key);
    this.entries.set(key, entry);

    return {
      state: now <= entry.freshUntil ? "fresh" : "stale",
      value: entry.value as T,
      freshUntil: entry.freshUntil,
      staleUntil: entry.staleUntil,
    };
  }

  async set<T>(key: string, value: T, options: CacheWriteOptions): Promise<void> {
    const now = Date.now();
    this.entries.set(key, {
      value,
      freshUntil: now + options.ttlMs,
      staleUntil: now + Math.max(options.staleTtlMs, options.ttlMs),
    });

    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }
}
