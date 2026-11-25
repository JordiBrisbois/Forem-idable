import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  markSyncStarted,
  markSyncSucceeded,
  markSyncFailed,
  upsertOffers,
  deleteOffersSyncedBefore,
} = vi.hoisted(() => ({
  markSyncStarted: vi.fn(async () => undefined),
  markSyncSucceeded: vi.fn(async () => undefined),
  markSyncFailed: vi.fn(async () => undefined),
  upsertOffers: vi.fn(async (...args: unknown[]) => (args[0] as unknown[] | undefined)?.length ?? 0),
  deleteOffersSyncedBefore: vi.fn(async () => 0),
}));

vi.mock("./repository", () => ({
  markSyncStarted,
  markSyncSucceeded,
  markSyncFailed,
  upsertOffers,
  deleteOffersSyncedBefore,
}));

vi.mock("@/lib/server/observability", () => ({
  logServerEvent: vi.fn(),
}));

import { runOffersSync } from "./sync";
import { ODWB_PAGE_SIZE } from "./source";

function records(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    numerooffreforem: String(index + 1),
    titreoffre: `Offre ${index + 1}`,
  }));
}

describe("runOffersSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertOffers.mockImplementation(async (...args: unknown[]) => (args[0] as unknown[]).length);
  });

  it("walks every page and prunes only after a complete pass", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ records: records(ODWB_PAGE_SIZE), total: ODWB_PAGE_SIZE + 2 })
      .mockResolvedValueOnce({ records: records(2), total: ODWB_PAGE_SIZE + 2 });

    const result = await runOffersSync({ fetchPage });

    expect(result).toEqual({ recordsSynced: ODWB_PAGE_SIZE + 2, pagesFetched: 2, removed: 0 });
    expect(markSyncStarted).toHaveBeenCalledOnce();
    expect(markSyncSucceeded).toHaveBeenCalledOnce();
    expect(deleteOffersSyncedBefore).toHaveBeenCalledOnce();
  });

  it("stops at maxPages without pruning", async () => {
    const fetchPage = vi.fn(async () => ({ records: records(ODWB_PAGE_SIZE), total: 10_000 }));

    const result = await runOffersSync({ fetchPage, maxPages: 2 });

    expect(result.pagesFetched).toBe(2);
    expect(deleteOffersSyncedBefore).not.toHaveBeenCalled();
  });

  it("marks the sync as failed and keeps existing rows when upstream breaks", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ records: records(ODWB_PAGE_SIZE), total: 500 })
      .mockRejectedValueOnce(new Error("ODWB rate limit reached"));

    await expect(runOffersSync({ fetchPage })).rejects.toThrow("ODWB rate limit reached");

    expect(markSyncFailed).toHaveBeenCalledOnce();
    expect(markSyncSucceeded).not.toHaveBeenCalled();
    expect(deleteOffersSyncedBefore).not.toHaveBeenCalled();
  });

  it("finishes on an empty first page", async () => {
    const fetchPage = vi.fn(async () => ({ records: [], total: 0 }));

    const result = await runOffersSync({ fetchPage });

    expect(result).toEqual({ recordsSynced: 0, pagesFetched: 0, removed: 0 });
    expect(upsertOffers).not.toHaveBeenCalled();
  });
});
