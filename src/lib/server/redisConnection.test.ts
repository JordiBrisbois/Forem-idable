import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { logServerEventMock, createClientMock, onMock, connectMock } = vi.hoisted(() => ({
  logServerEventMock: vi.fn(),
  createClientMock: vi.fn(),
  onMock: vi.fn(),
  connectMock: vi.fn(),
}));

vi.mock("@/lib/server/observability", () => ({ logServerEvent: logServerEventMock }));
vi.mock("redis", () => ({ createClient: createClientMock }));

import {
  attachRedisErrorHandler,
  connectRedis,
  resetRedisErrorLogForTests,
  type RedisClient,
} from "@/lib/server/redisConnection";

describe("connectRedis", () => {
  beforeEach(() => {
    createClientMock.mockReturnValue({ isOpen: true, on: onMock, connect: connectMock });
    connectMock.mockResolvedValue(undefined);
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetRedisErrorLogForTests();
    createClientMock.mockReset();
    onMock.mockReset();
    connectMock.mockReset();
    logServerEventMock.mockReset();
  });

  it("returns null when Redis is not configured", async () => {
    vi.stubEnv("REDIS_URL", "");

    await expect(connectRedis("cache")).resolves.toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("connects to the configured URL and returns the client", async () => {
    const client = await connectRedis("cache");

    expect(createClientMock).toHaveBeenCalledWith({ url: "redis://localhost:6379" });
    expect(connectMock).toHaveBeenCalledOnce();
    expect(client).toEqual(expect.objectContaining({ isOpen: true }));
  });

  it("returns null and logs once when the connection fails", async () => {
    connectMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(connectRedis("rate-limit")).resolves.toBeNull();
    expect(logServerEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "redis_unavailable",
        meta: { purpose: "rate-limit", error: "ECONNREFUSED" },
      }),
    );
  });
});

describe("attachRedisErrorHandler", () => {
  beforeEach(() => {
    createClientMock.mockReturnValue({ isOpen: true, on: onMock, connect: connectMock });
    connectMock.mockResolvedValue(undefined);
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetRedisErrorLogForTests();
    onMock.mockReset();
    logServerEventMock.mockReset();
  });

  it("reports the first error of a purpose only", async () => {
    await connectRedis("cache");
    const handler = onMock.mock.calls[0]?.[1] as (error: Error) => void;

    handler(new Error("first"));
    handler(new Error("second"));

    expect(logServerEventMock).toHaveBeenCalledTimes(1);
    expect(logServerEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "redis_error",
        meta: { purpose: "cache", error: "first" },
      }),
    );
  });

  it("keeps logging for a different purpose", async () => {
    const client = { on: onMock } as unknown as RedisClient;

    attachRedisErrorHandler(client, "cache");
    attachRedisErrorHandler(client, "message-events");

    const [cacheHandler, messageHandler] = onMock.mock.calls.map(
      (call) => call[1] as (error: Error) => void,
    );
    cacheHandler?.(new Error("cache down"));
    messageHandler?.(new Error("events down"));

    expect(logServerEventMock).toHaveBeenCalledTimes(2);
  });
});
