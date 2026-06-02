import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();
const redisEvalMock = vi.fn();
const redisConnectMock = vi.fn();
const redisOnMock = vi.fn();

vi.mock("redis", () => ({
  createClient: vi.fn(() => ({
    isOpen: true,
    on: redisOnMock,
    connect: redisConnectMock,
    eval: redisEvalMock,
  })),
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

describe("checkRateLimit", () => {
  beforeEach(() => {
    headersMock.mockResolvedValue(
      new Headers({
        "x-forwarded-for": "203.0.113.10",
      })
    );
  });

  afterEach(() => {
    globalThis.__foremIdableRateLimitStore?.clear();
    globalThis.__foremIdableRedisRateLimitClient = undefined;
    globalThis.__foremIdableRedisRateLimitPromise = undefined;
    redisEvalMock.mockReset();
    redisConnectMock.mockReset();
    redisOnMock.mockReset();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("enforces the limit with the in-memory fallback", async () => {
    vi.stubEnv("REDIS_URL", "");
    const { checkRateLimit } = await import("@/lib/server/rateLimit");

    const first = await checkRateLimit({
      scope: "test",
      limit: 2,
      windowMs: 60_000,
    });
    const second = await checkRateLimit({
      scope: "test",
      limit: 2,
      windowMs: 60_000,
    });
    const third = await checkRateLimit({
      scope: "test",
      limit: 2,
      windowMs: 60_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it("isolates buckets when an identifier is provided", async () => {
    vi.stubEnv("REDIS_URL", "");
    const { checkRateLimit } = await import("@/lib/server/rateLimit");

    const firstEmail = await checkRateLimit({
      scope: "auth-login",
      limit: 1,
      windowMs: 60_000,
      identifier: "first@example.com",
    });
    const secondEmail = await checkRateLimit({
      scope: "auth-login",
      limit: 1,
      windowMs: 60_000,
      identifier: "second@example.com",
    });
    const blockedFirstEmail = await checkRateLimit({
      scope: "auth-login",
      limit: 1,
      windowMs: 60_000,
      identifier: "first@example.com",
    });

    expect(firstEmail.allowed).toBe(true);
    expect(secondEmail.allowed).toBe(true);
    expect(blockedFirstEmail.allowed).toBe(false);
  });

  it("uses the Redis Lua path when REDIS_URL is configured", async () => {
    vi.stubEnv("REDIS_URL", "redis://example:6379");
    redisEvalMock
      .mockResolvedValueOnce([1, 60_000])
      .mockResolvedValueOnce([2, 59_000])
      .mockResolvedValueOnce([3, 58_000]);

    const { checkRateLimit } = await import("@/lib/server/rateLimit");

    const first = await checkRateLimit({
      scope: "external-api",
      limit: 2,
      windowMs: 60_000,
    });
    const second = await checkRateLimit({
      scope: "external-api",
      limit: 2,
      windowMs: 60_000,
    });
    const third = await checkRateLimit({
      scope: "external-api",
      limit: 2,
      windowMs: 60_000,
    });

    expect(redisConnectMock).toHaveBeenCalledTimes(1);
    expect(redisEvalMock).toHaveBeenCalledTimes(3);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it("falls back to memory when Redis evaluation fails", async () => {
    vi.stubEnv("REDIS_URL", "redis://example:6379");
    redisEvalMock.mockRejectedValue(new Error("redis down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { checkRateLimit } = await import("@/lib/server/rateLimit");

    const first = await checkRateLimit({
      scope: "auth-login",
      limit: 1,
      windowMs: 60_000,
    });
    const second = await checkRateLimit({
      scope: "auth-login",
      limit: 1,
      windowMs: 60_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
  });
});
