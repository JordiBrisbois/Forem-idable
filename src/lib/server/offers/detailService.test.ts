import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCache, getPayload, saveDetail } = vi.hoisted(() => ({
  getCache: vi.fn(),
  getPayload: vi.fn(),
  saveDetail: vi.fn(),
}));

vi.mock("@/lib/server/offers/repository", () => ({
  getOfferDetailCache: getCache,
  getOfferPayload: getPayload,
  saveOfferDetail: saveDetail,
}));

import {
  getOfferDetail,
  resetOfferDetailServiceForTests,
} from "@/lib/server/offers/detailService";

const remote = {
  source: "forem-detail-api" as const,
  description: "Description complète",
  highlights: [{ label: "Employeur", value: "ACME" }],
  sections: [],
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function stubForem(payload: unknown = { titreOffre: "Peintre", descriptionJob: "<p>Peindre</p>" }) {
  const fetchMock = vi.fn(async () => jsonResponse(payload));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getOfferDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    resetOfferDetailServiceForTests();
    getCache.mockResolvedValue(null);
    getPayload.mockResolvedValue(null);
    saveDetail.mockResolvedValue(undefined);
  });

  it("fetches the Forem detail once and stores it", async () => {
    const fetchMock = stubForem();

    const detail = await getOfferDetail("1");

    expect(detail?.source).toBe("forem-detail-api");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(saveDetail).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({ source: "forem-detail-api" })
    );
  });

  it("serves a fresh cache entry without calling the third party", async () => {
    const fetchMock = stubForem();
    getCache.mockResolvedValueOnce({ detail: remote, fetchedAt: new Date() });

    const detail = await getOfferDetail("1");

    expect(detail).toEqual(remote);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serves a stale entry immediately and refreshes it in the background", async () => {
    const fetchMock = stubForem({ titreOffre: "Peintre", descriptionJob: "<p>Neuf</p>" });
    getCache.mockResolvedValueOnce({
      detail: remote,
      fetchedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });

    const detail = await getOfferDetail("1");

    expect(detail).toEqual(remote);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  });

  it("deduplicates concurrent requests for the same offer", async () => {
    const fetchMock = stubForem();

    await Promise.all([getOfferDetail("1"), getOfferDetail("1"), getOfferDetail("1")]);

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("falls back to the mirror when the Forem does not know the offer", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ html: "SPA" })));
    getPayload.mockResolvedValue({ numerooffreforem: "1", metier: "Peinture industrielle" });

    const detail = await getOfferDetail("1");

    expect(detail?.source).toBe("mirror");
    // The fallback is cached too, so a dead offer is not retried on every view.
    expect(saveDetail).toHaveBeenCalledWith("1", expect.objectContaining({ source: "mirror" }));
  });

  it("returns null when neither the Forem nor the mirror knows the offer", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404 })));
    getPayload.mockResolvedValue(null);

    expect(await getOfferDetail("1")).toBeNull();
  });
});
