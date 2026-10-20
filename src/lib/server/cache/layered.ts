import type { CacheLookup, CacheStore, CacheWriteOptions } from "./types";

/**
 * Composes stores ordered from fastest to slowest (memory → Redis). A hit on a
 * slower layer rehydrates the faster ones for the remaining lifetime, so Redis
 * reduces upstream calls without making every read pay the Redis latency twice.
 */
export class LayeredCacheStore implements CacheStore {
  constructor(private readonly layers: CacheStore[]) {}

  async get<T>(key: string): Promise<CacheLookup<T>> {
    for (let index = 0; index < this.layers.length; index += 1) {
      const result = await this.layers[index].get<T>(key);
      if (result.state === "miss") continue;

      const now = Date.now();
      for (let faster = 0; faster < index; faster += 1) {
        const ttlMs = result.freshUntil - now;
        const staleTtlMs = result.staleUntil - now;
        if (staleTtlMs <= 0) continue;
        await this.layers[faster].set(key, result.value, {
          ttlMs: Math.max(ttlMs, 0),
          staleTtlMs,
        });
      }

      return result;
    }

    return { state: "miss" };
  }

  async set<T>(key: string, value: T, options: CacheWriteOptions): Promise<void> {
    await Promise.all(this.layers.map((layer) => layer.set(key, value, options)));
  }

  async clear(): Promise<void> {
    await Promise.all(this.layers.map((layer) => layer.clear()));
  }
}
