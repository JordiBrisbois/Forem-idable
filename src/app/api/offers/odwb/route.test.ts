import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetCachesForTests } from "@/lib/server/cache";
import { resetOdwbBudgetForTests } from "@/lib/server/cache/budget";
import { GET } from "./route";

vi.mock("@/lib/server/rateLimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
}));

const OK_BODY = JSON.stringify({ total_count: 1, results: [{ numerooffreforem: "1" }] });

function request(query: string) {
  return new NextRequest(`https://app.test/api/offers/odwb${query}`);
}

describe("GET /api/offers/odwb", () => {
  beforeEach(async () => {
    await resetCachesForTests();
    resetOdwbBudgetForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires limit and offset", async () => {
    const response = await GET(request(""));
    expect(response.status).toBe(400);
  });

  it("rejects out-of-range params", async () => {
    const response = await GET(request("?limit=1000&offset=0"));
    expect(response.status).toBe(400);
  });

  it("proxies the dataset and serves repeats from the shared cache", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => OK_BODY,
    } as Response);

    const url = "?limit=5&offset=0&where=search(%22proxytest%22)";
    const first = await GET(request(url));
    const second = await GET(request(url));

    expect(first.status).toBe(200);
    expect(first.headers.get("x-cache")).toBe("miss");
    expect(first.headers.get("x-odwb-budget-remaining")).toBeTruthy();
    expect(second.headers.get("x-cache")).toBe("hit");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    await expect(second.json()).resolves.toEqual({
      total_count: 1,
      results: [{ numerooffreforem: "1" }],
    });
  });

  it("passes an upstream 429 through to the client", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: "You have exceeded the requests limit" }),
    } as Response);

    const response = await GET(request("?limit=5&offset=100&where=unique-429-query"));
    expect(response.status).toBe(429);
    expect(response.headers.get("x-cache")).toBe("miss");
  });

  it("does not call the upstream once the ODWB budget is exhausted", async () => {
    vi.stubEnv("OFFERS_API_DAILY_BUDGET", "1");
    vi.stubEnv("OFFERS_API_MAX_CALLS_PER_MINUTE", "100");

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => OK_BODY,
    } as Response);

    const first = await GET(request("?limit=5&offset=0&where=budget-first"));
    expect(first.status).toBe(200);

    const denied = await GET(request("?limit=5&offset=0&where=budget-second"));
    expect(denied.status).toBe(429);
    expect(denied.headers.get("x-cache")).toBe("budget");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.unstubAllEnvs();
  });
});
