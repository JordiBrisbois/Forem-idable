import { getRedisClient } from "@/lib/server/redis";
import type { CacheLookup, CacheStore, CacheWriteOptions } from "./types";

interface RedisPayload<T> {
  value: T;
  freshUntil: number;
  staleUntil: number;
}

/**
 * L2 cache backed by Redis. Every operation is best-effort: if Redis is absent,
 * disabled, or fails at runtime, reads miss and writes are dropped — the request
 * path must never break because of the cache.
 */
export class RedisCacheStore implements CacheStore {
  constructor(private readonly namespace: string) {}

  private redisKey(key: string) {
    return `${this.namespace}:${key}`;
  }

  async get<T>(key: string): Promise<CacheLookup<T>> {
    const client = await getRedisClient();
    if (!client) return { state: "miss" };

    try {
      const raw = await client.get(this.redisKey(key));
      if (!raw) return { state: "miss" };

      const payload = JSON.parse(raw) as RedisPayload<T>;
      const now = Date.now();
      if (now > payload.staleUntil) return { state: "miss" };

      return {
        state: now <= payload.freshUntil ? "fresh" : "stale",
        value: payload.value,
        freshUntil: payload.freshUntil,
        staleUntil: payload.staleUntil,
      };
    } catch {
      return { state: "miss" };
    }
  }

  async set<T>(key: string, value: T, options: CacheWriteOptions): Promise<void> {
    const client = await getRedisClient();
    if (!client) return;

    const now = Date.now();
    const staleUntil = now + Math.max(options.staleTtlMs, options.ttlMs);
    const payload: RedisPayload<T> = {
      value,
      freshUntil: now + options.ttlMs,
      staleUntil,
    };

    try {
      await client.set(this.redisKey(key), JSON.stringify(payload), {
        PX: Math.max(staleUntil - now, 1000),
      });
    } catch {
      // Best-effort: ignore cache write failures.
    }
  }

  async clear(): Promise<void> {
    // Namespaced flush is intentionally a no-op: we never want to scan/delete
    // keys on a shared Redis. Entries expire on their own.
  }
}
