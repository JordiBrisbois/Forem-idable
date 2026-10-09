import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/server/rateLimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
}));

const OK_BODY = JSON.stringify({ total_count: 1, results: [{ numerooffreforem: "1" }] });

function request(query: string) {
  return new NextRequest(`https://app.test/api/offers/odwb${query}`);
}

describe("GET /api/offers/odwb", () => {
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
  });
});
