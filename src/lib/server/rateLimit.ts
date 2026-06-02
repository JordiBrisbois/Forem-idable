import { createHash } from "crypto";
import { headers } from "next/headers";
import { createClient } from "redis";
import { logServerEvent, measureServerOperation } from "@/lib/server/observability";

type RateLimitRedisClient = ReturnType<typeof createClient>;

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

const REDIS_RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { current, ttl }
`;

declare global {
  var __foremIdableRateLimitStore: Map<string, Bucket> | undefined;
  var __foremIdableRedisRateLimitClient: RateLimitRedisClient | undefined;
  var __foremIdableRedisRateLimitPromise: Promise<RateLimitRedisClient | null> | undefined;
}

const memoryStore = globalThis.__foremIdableRateLimitStore ?? new Map<string, Bucket>();

if (!globalThis.__foremIdableRateLimitStore) {
  globalThis.__foremIdableRateLimitStore = memoryStore;
}

function getNow() {
  return Date.now();
}

function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildRateLimitKey(input: {
  scope: string;
  ip: string;
  identifier?: string | null;
}) {
  const suffix = input.identifier ? `:${hashIdentifier(input.identifier)}` : "";
  return `rate-limit:${input.scope}:${input.ip}${suffix}`;
}

async function getClientIp() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headerStore.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = headerStore.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "unknown";
}

async function getRedisClient() {
  if (globalThis.__foremIdableRedisRateLimitClient?.isOpen) {
    return globalThis.__foremIdableRedisRateLimitClient;
  }

  if (globalThis.__foremIdableRedisRateLimitPromise) {
    return globalThis.__foremIdableRedisRateLimitPromise;
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return null;
  }

  globalThis.__foremIdableRedisRateLimitPromise = (async () => {
    try {
      const client = createClient({ url: redisUrl });
      client.on("error", (error) => {
        console.error("Redis rate limit error", error);
      });
      await client.connect();
      globalThis.__foremIdableRedisRateLimitClient = client;
      return client;
    } catch (error) {
      console.error("Redis rate limit unavailable", error);
      return null;
    } finally {
      globalThis.__foremIdableRedisRateLimitPromise = undefined;
    }
  })();

  return globalThis.__foremIdableRedisRateLimitPromise;
}

function applyMemoryRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = getNow();
  const existing = memoryStore.get(input.key);

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs,
    });

    return {
      allowed: true,
      remaining: input.limit - 1,
      retryAfterMs: input.windowMs,
    };
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, existing.resetAt - now),
    };
  }

  existing.count += 1;
  memoryStore.set(input.key, existing);

  return {
    allowed: true,
    remaining: input.limit - existing.count,
    retryAfterMs: Math.max(0, existing.resetAt - now),
  };
}

async function applyRedisRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  client: RateLimitRedisClient;
}): Promise<RateLimitResult> {
  const [count, ttl] = (await measureServerOperation({
    category: "redis",
    action: "rate-limit-eval",
    meta: {
      scope: input.key.split(":")[1] ?? "unknown",
    },
    run: async () =>
      (await input.client.eval(REDIS_RATE_LIMIT_SCRIPT, {
        keys: [input.key],
        arguments: [String(input.windowMs)],
      })) as [number, number],
  })) ?? [1, input.windowMs];
  const retryAfterMs = ttl > 0 ? ttl : input.windowMs;

  return {
    allowed: count <= input.limit,
    remaining: Math.max(0, input.limit - count),
    retryAfterMs,
  };
}

export async function checkRateLimit(input: {
  scope: string;
  limit: number;
  windowMs: number;
  identifier?: string | null;
}) {
  const ip = await getClientIp();
  const key = buildRateLimitKey({
    scope: input.scope,
    ip,
    identifier: input.identifier?.trim() || null,
  });
  const redisClient = await getRedisClient();

  if (redisClient) {
    try {
      const result = await applyRedisRateLimit({
        key,
        limit: input.limit,
        windowMs: input.windowMs,
        client: redisClient,
      });
      if (!result.allowed) {
        logServerEvent({
          category: "security",
          action: "rate_limit_blocked",
          level: "warn",
          meta: {
            scope: input.scope,
            limit: input.limit,
            windowMs: input.windowMs,
            backend: "redis",
            retryAfterMs: result.retryAfterMs,
          },
        });
      }
      return result;
    } catch (error) {
      console.error("Redis rate limit error", error);
      logServerEvent({
        category: "redis",
        action: "rate-limit-fallback",
        level: "warn",
        meta: {
          scope: input.scope,
          reason: error instanceof Error ? error.message : "unknown",
        },
      });
    }
  }

  const result = await measureServerOperation({
    category: "rate-limit",
    action: "memory-fallback",
    meta: {
      scope: input.scope,
    },
    run: async () =>
      applyMemoryRateLimit({
        key,
        limit: input.limit,
        windowMs: input.windowMs,
      }),
  });
  if (!result.allowed) {
    logServerEvent({
      category: "security",
      action: "rate_limit_blocked",
      level: "warn",
      meta: {
        scope: input.scope,
        limit: input.limit,
        windowMs: input.windowMs,
        backend: "memory",
        retryAfterMs: result.retryAfterMs,
      },
    });
  }
  return result;
}
