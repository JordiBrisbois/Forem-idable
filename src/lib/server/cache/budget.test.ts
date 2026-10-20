import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/redis", () => ({
  getRedisClient: async () => null,
}));

vi.mock("@/lib/server/observability", () => ({
  logServerEvent: vi.fn(),
}));

import { logServerEvent } from "@/lib/server/observability";
import { reserveOdwbCall, resetOdwbBudgetForTests } from "./budget";

describe("reserveOdwbCall", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    resetOdwbBudgetForTests();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("increments and allows calls under the limit", async () => {
    vi.stubEnv("OFFERS_API_DAILY_BUDGET", "3");
    vi.stubEnv("OFFERS_API_MAX_CALLS_PER_MINUTE", "100");

    const status = await reserveOdwbCall();

    expect(status).toMatchObject({ allowed: true, used: 1, limit: 3, remaining: 2 });
  });

  it("denies once the daily budget is exceeded", async () => {
    vi.stubEnv("OFFERS_API_DAILY_BUDGET", "1");
    vi.stubEnv("OFFERS_API_MAX_CALLS_PER_MINUTE", "100");

    expect((await reserveOdwbCall()).allowed).toBe(true);
    expect(await reserveOdwbCall()).toMatchObject({
      allowed: false,
      reason: "daily",
      remaining: 0,
    });
  });

  it("denies bursts above the per-minute limit", async () => {
    vi.stubEnv("OFFERS_API_DAILY_BUDGET", "100");
    vi.stubEnv("OFFERS_API_MAX_CALLS_PER_MINUTE", "1");

    expect((await reserveOdwbCall()).allowed).toBe(true);
    expect(await reserveOdwbCall()).toMatchObject({ allowed: false, reason: "burst" });
  });

  it("logs the 80% warning only once", async () => {
    vi.stubEnv("OFFERS_API_DAILY_BUDGET", "10");
    vi.stubEnv("OFFERS_API_MAX_CALLS_PER_MINUTE", "100");

    for (let index = 0; index < 8; index += 1) {
      await reserveOdwbCall();
    }
    expect(logServerEvent).toHaveBeenCalledTimes(1);

    await reserveOdwbCall();
    expect(logServerEvent).toHaveBeenCalledTimes(1);
  });
});
