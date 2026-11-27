import { describe, expect, it, vi } from "vitest";

const { getLocationCentroid, checkRateLimit } = vi.hoisted(() => ({
  getLocationCentroid: vi.fn(),
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
}));

vi.mock("@/lib/server/offers/repository", () => ({ getLocationCentroid }));
vi.mock("@/lib/server/rateLimit", () => ({ checkRateLimit }));

import { GET } from "./route";

function request(query = "") {
  return new Request(`https://app.test/api/offers/centroid${query}`);
}

describe("GET /api/offers/centroid", () => {
  it("rejects a request without a place", async () => {
    const response = await GET(request());

    expect(response.status).toBe(400);
    expect(getLocationCentroid).not.toHaveBeenCalled();
  });

  it("returns the centroid of a postal code", async () => {
    getLocationCentroid.mockResolvedValueOnce({ lat: 50.47, lon: 4.87, offers: 2200 } as never);

    const response = await GET(request("?postalCode=5000&name=Namur"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ lat: 50.47, lon: 4.87, offers: 2200 });
    expect(getLocationCentroid).toHaveBeenCalledWith({ postalCode: "5000", name: "Namur" });
  });

  it("reports a place without coordinates as not found", async () => {
    getLocationCentroid.mockResolvedValueOnce(null);

    const response = await GET(request("?name=Inconnu"));

    expect(response.status).toBe(404);
  });
});
