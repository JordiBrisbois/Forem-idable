import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Runs against a real Redis, which is why it is skipped unless REDIS_URL is set
 * (the `redis` CI job provides a `redis:7.2-alpine` service).
 *
 * The unit tests mock the client, so they prove the wiring but not that the
 * protocol calls we rely on still work — this file covers exactly that gap:
 * connection, commands, the Lua script behind the rate limiter, and pub/sub.
 */
const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock("next/headers", () => ({ headers: headersMock }));

import { checkRateLimit } from "@/lib/server/rateLimit";
import { connectRedis, type RedisClient } from "@/lib/server/redisConnection";

const redisUrl = process.env.REDIS_URL?.trim();
const describeWithRedis = redisUrl ? describe : describe.skip;

describeWithRedis("Redis integration", () => {
  let client: RedisClient;
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    const connected = await connectRedis("cache");
    expect(connected, "connectRedis should return a client when REDIS_URL is set").not.toBeNull();
    client = connected as RedisClient;
  });

  afterAll(async () => {
    if (client?.isOpen) {
      await client.quit();
    }
  });

  it("answers PING on the shared connection", async () => {
    await expect(client.ping()).resolves.toBe("PONG");
  });

  it("round-trips a value with an expiry", async () => {
    const key = `itest:${runId}:value`;

    await client.set(key, "42", { EX: 30 });
    await expect(client.get(key)).resolves.toBe("42");
    await expect(client.ttl(key)).resolves.toBeGreaterThan(0);

    await client.del(key);
    await expect(client.get(key)).resolves.toBeNull();
  });

  it("enforces the rate limit through the Lua script", async () => {
    headersMock.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.99" }),
    );

    const scope = `itest-${runId}`;
    const limit = 2;

    const first = await checkRateLimit({ scope, limit, windowMs: 5_000 });
    const second = await checkRateLimit({ scope, limit, windowMs: 5_000 });
    const third = await checkRateLimit({ scope, limit, windowMs: 5_000 });

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it("delivers a published message to a duplicated subscriber", async () => {
    const subscriber = client.duplicate();
    await subscriber.connect();

    const channel = `itest:${runId}:events`;
    const received = new Promise<string>((resolve) => {
      void subscriber.subscribe(channel, (message) => resolve(message));
    });

    await client.publish(channel, "conversation.created");
    await expect(received).resolves.toBe("conversation.created");

    await subscriber.unsubscribe(channel);
    await subscriber.quit();
  });
});
