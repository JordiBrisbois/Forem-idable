import { afterEach, describe, expect, it, vi } from "vitest";
import { OffersUnavailableError, searchOffers } from "./offersClient";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("searchOffers client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the structured criteria and returns the mirrored page", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(jsonResponse(200, { jobs: [{ id: "1" }], total: 1 }));

    const result = await searchOffers({
      keywords: ["react"],
      contractTypes: ["CDI"],
      locations: [{ id: "namur", name: "Namur", type: "Communes" }],
      limit: 50,
      offset: 100,
    });

    expect(result).toEqual({ jobs: [{ id: "1" }], total: 1 });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/offers/search");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      keywords: ["react"],
      contractTypes: ["CDI"],
      limit: 50,
      offset: 100,
    });
  });

  it("flags our own rate limiter separately from an outage", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse(429, { reason: "rate_limited" }));

    await expect(searchOffers({})).rejects.toMatchObject({
      name: "OffersUnavailableError",
      reason: "rate_limited",
    });
  });

  it("maps a server failure to unavailable", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse(503, {}));

    await expect(searchOffers({})).rejects.toBeInstanceOf(OffersUnavailableError);
  });

  it("maps a network error to unavailable", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("offline"));

    await expect(searchOffers({})).rejects.toMatchObject({ reason: "unavailable" });
  });

  it("tolerates a payload without jobs", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse(200, {}));

    await expect(searchOffers({})).resolves.toEqual({ jobs: [], total: 0 });
  });
});
