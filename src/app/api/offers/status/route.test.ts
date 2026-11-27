import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMirrorStatus, countOffersFirstSeenSince } = vi.hoisted(() => ({
  getMirrorStatus: vi.fn(),
  countOffersFirstSeenSince: vi.fn(),
}));

vi.mock("@/lib/server/offers/repository", () => ({ getMirrorStatus, countOffersFirstSeenSince }));
vi.mock("@/lib/server/rateLimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
}));

import { GET } from "./route";

const status = {
  offers: 24163,
  lastSyncAt: "2026-03-01T08:00:00.000Z",
  lastSyncStatus: "success",
  ageMinutes: 120,
  stale: false,
};

function request(query = "") {
  return new Request(`https://app.test/api/offers/status${query}`);
}

describe("GET /api/offers/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMirrorStatus.mockResolvedValue(status);
    countOffersFirstSeenSince.mockResolvedValue(12);
  });

  it("returns the mirror freshness", async () => {
    const response = await GET(request());

    await expect(response.json()).resolves.toEqual({ ...status, newOffers: null });
  });

  it("counts offers ingested since the previous visit", async () => {
    const response = await GET(request("?since=2026-03-01T06:00:00Z"));

    await expect(response.json()).resolves.toEqual({ ...status, newOffers: 12 });
    expect(countOffersFirstSeenSince).toHaveBeenCalledWith(new Date("2026-03-01T06:00:00Z"));
  });

  it("ignores an invalid since value", async () => {
    await GET(request("?since=not-a-date"));

    expect(countOffersFirstSeenSince).not.toHaveBeenCalled();
  });

  it("degrades to a stale status when the database is unavailable", async () => {
    getMirrorStatus.mockRejectedValueOnce(new Error("db down"));

    const response = await GET(request());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ stale: true, offers: 0 });
  });
});
