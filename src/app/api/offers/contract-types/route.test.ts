import { beforeEach, describe, expect, it, vi } from "vitest";

const { countOffersByContractType } = vi.hoisted(() => ({
  countOffersByContractType: vi.fn(),
}));

vi.mock("@/lib/server/offers/repository", () => ({ countOffersByContractType }));

vi.mock("@/lib/server/rateLimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
}));

import { GET } from "./route";

describe("GET /api/offers/contract-types", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("labels the counts read from the mirror", async () => {
    countOffersByContractType.mockResolvedValue([
      { type: "CDI", count: 12 },
      { type: "STAGE", count: 3 },
    ]);

    const response = await GET();
    const body = (await response.json()) as { types: Array<{ type: string; label: string; count: number }> };

    expect(body.types).toEqual([
      { type: "CDI", label: "CDI", count: 12 },
      { type: "STAGE", label: "Stage", count: 3 },
    ]);
    expect(response.headers.get("x-offers-source")).toBe("mirror");
  });

  it("returns an empty list when the mirror is unreachable", async () => {
    countOffersByContractType.mockRejectedValue(new Error("db down"));

    const response = await GET();

    await expect(response.json()).resolves.toEqual({ types: [] });
  });

  it("returns an empty list when rate limited, without touching the database", async () => {
    const { checkRateLimit } = await import("@/lib/server/rateLimit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false } as never);

    const response = await GET();

    await expect(response.json()).resolves.toEqual({ types: [] });
    expect(countOffersByContractType).not.toHaveBeenCalled();
  });
});
