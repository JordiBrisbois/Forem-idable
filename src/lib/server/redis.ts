import { createClient } from "redis";
import { logServerEvent } from "@/lib/server/observability";

type RedisClient = ReturnType<typeof createClient>;

declare global {
  var __appRedisCacheClient: RedisClient | undefined;
  var __appRedisCachePromise: Promise<RedisClient | null> | undefined;
  var __appRedisCacheErrorLogged: boolean | undefined;
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

  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return null;
  }

  globalThis.__appRedisCachePromise = (async () => {
    try {
      const client = createClient({ url: redisUrl });
      client.on("error", (error) => {
        if (!globalThis.__appRedisCacheErrorLogged) {
          globalThis.__appRedisCacheErrorLogged = true;
          logServerEvent({
            category: "cache",
            action: "redis_error",
            level: "warn",
            meta: { error: error instanceof Error ? error.message : String(error) },
          });
        }
      });
      await client.connect();
      globalThis.__appRedisCacheClient = client;
      return client;
    } catch (error) {
      logServerEvent({
        category: "cache",
        action: "redis_unavailable",
        level: "warn",
        meta: { error: error instanceof Error ? error.message : String(error) },
      });
      return null;
    } finally {
      globalThis.__appRedisCachePromise = undefined;
    }
  })();

  return globalThis.__appRedisCachePromise;
}

/** Test helper: drop the shared connection so the next call reconnects. */
export function resetRedisClientForTests() {
  globalThis.__appRedisCacheClient = undefined;
  globalThis.__appRedisCachePromise = undefined;
  globalThis.__appRedisCacheErrorLogged = undefined;
}
