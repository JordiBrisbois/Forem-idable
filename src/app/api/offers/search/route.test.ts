import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchOffers } = vi.hoisted(() => ({ searchOffers: vi.fn() }));

vi.mock("@/lib/server/offers/repository", () => ({ searchOffers }));

vi.mock("@/lib/server/rateLimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
}));

import { POST } from "./route";

function post(body: unknown) {
  return POST(
    new Request("https://app.test/api/offers/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/offers/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchOffers.mockResolvedValue({ jobs: [{ id: "1" }], total: 1 });
  });

  it("returns the mirrored results and never calls upstream", async () => {
    const response = await post({ keywords: ["react"], limit: 20, offset: 0 });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-offers-source")).toBe("mirror");
    await expect(response.json()).resolves.toEqual({ jobs: [{ id: "1" }], total: 1 });
    expect(searchOffers).toHaveBeenCalledWith(
      expect.objectContaining({ keywords: ["react"], limit: 20, offset: 0 })
    );
  });

  it("applies safe defaults for limit and offset", async () => {
    await post({});

    expect(searchOffers).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100, offset: 0 })
    );
  });

  it("rejects invalid criteria", async () => {
    for (const body of [
      { limit: 5000 },
      { offset: -1 },
      { contractTypes: ["PAS_UN_CONTRAT"] },
      { locations: [{ name: "Namur", type: "Planète" }] },
      { keywords: ["x".repeat(200)] },
    ]) {
      const response = await post(body);
      expect(response.status, JSON.stringify(body)).toBe(400);
    }
    expect(searchOffers).not.toHaveBeenCalled();
  });

  it("maps a mirror failure to 503, not to a quota error", async () => {
    searchOffers.mockRejectedValueOnce(new Error("db down"));

    const response = await post({ keywords: ["react"] });
    const body = (await response.json()) as { reason: string };

    expect(response.status).toBe(503);
    expect(body.reason).toBe("unavailable");
  });

  it("returns 429 only for our own rate limiter", async () => {
    const { checkRateLimit } = await import("@/lib/server/rateLimit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false } as never);

    const response = await post({ keywords: ["react"] });
    const body = (await response.json()) as { reason: string };

    expect(response.status).toBe(429);
    expect(body.reason).toBe("rate_limited");
    expect(searchOffers).not.toHaveBeenCalled();
  });
});
