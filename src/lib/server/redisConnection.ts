import { createClient } from "redis";

import { logServerEvent } from "@/lib/server/observability";

/**
 * The client type is derived from the factory call rather than from
 * `ReturnType<typeof createClient>`: in redis v6 `createClient` is generic over
 * the module/script sets and its unbound `ReturnType` no longer matches what
 * `createClient({ url })` actually returns.
 */
function createRedisClient(url: string) {
  return createClient({ url });
}

export type RedisClient = ReturnType<typeof createRedisClient>;

/**
 * Why a connection exists. It ends up in the log line, so an incident says
 * which feature lost Redis instead of only that "Redis had an error".
 */
export type RedisPurpose =
  | "cache"
  | "rate-limit"
  | "message-events"
  | "message-events-subscriber";

const errorLoggedFor = new Set<RedisPurpose>();

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Attaches the structured error log to a client.
 *
 * A dropped Redis connection retries in the background and can emit the same
 * error repeatedly; logging the first one per purpose keeps a flapping server
 * from flooding the request log.
 */
export function attachRedisErrorHandler(
  client: RedisClient,
  purpose: RedisPurpose,
  once = true,
): void {
  client.on("error", (error) => {
    if (once && errorLoggedFor.has(purpose)) {
      return;
    }

    errorLoggedFor.add(purpose);
    logServerEvent({
      category: "cache",
      action: "redis_error",
      level: "warn",
      meta: { purpose, error: describeError(error) },
    });
  });
}

/**
 * Opens a Redis connection, or returns `null` when Redis is not configured or
 * unreachable.
 *
 * Redis is optional in this deployment: every caller is expected to degrade to
 * an in-process fallback, so a missing server is a normal outcome rather than
 * an error that should propagate.
 */
export async function connectRedis(purpose: RedisPurpose): Promise<RedisClient | null> {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return null;
  }

  const client = createRedisClient(redisUrl);
  attachRedisErrorHandler(client, purpose);

  try {
    await client.connect();
    return client;
  } catch (error) {
    logServerEvent({
      category: "cache",
      action: "redis_unavailable",
      level: "warn",
      meta: { purpose, error: describeError(error) },
    });
    return null;
  }
}

/** Test helper: forget which purposes already reported an error. */
export function resetRedisErrorLogForTests(): void {
  errorLoggedFor.clear();
}
