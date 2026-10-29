import { connectRedis, type RedisClient } from "@/lib/server/redisConnection";

declare global {
  var __appRedisCacheClient: RedisClient | undefined;
  var __appRedisCachePromise: Promise<RedisClient | null> | undefined;
}

/**
 * Single shared Redis connection for server-side caching. Returns `null` when
 * Redis is not configured or unavailable, so callers degrade to memory-only.
 * Redis being optional is a first-class case here, not an error path.
 */
export async function getRedisClient(): Promise<RedisClient | null> {
  if (globalThis.__appRedisCacheClient?.isOpen) {
    return globalThis.__appRedisCacheClient;
  }

  if (globalThis.__appRedisCachePromise) {
    return globalThis.__appRedisCachePromise;
  }

  globalThis.__appRedisCachePromise = connectRedis("cache").then((client) => {
    globalThis.__appRedisCacheClient = client ?? undefined;
    globalThis.__appRedisCachePromise = undefined;
    return client;
  });

  return globalThis.__appRedisCachePromise;
}

/** Test helper: drop the shared connection so the next call reconnects. */
export function resetRedisClientForTests() {
  globalThis.__appRedisCacheClient = undefined;
  globalThis.__appRedisCachePromise = undefined;
}
