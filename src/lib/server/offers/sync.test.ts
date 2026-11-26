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
  upsertOffers: vi.fn(async () => 0),
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

import { normalizeOffer } from "./normalize";
import { runOffersSync } from "./sync";

function snapshot(count: number) {
  return {
    offers: Array.from({ length: count }, (_, index) =>
      normalizeOffer({
        numerooffreforem: String(index + 1),
        titreoffre: `Offre ${index + 1}`,
      })
    ),
    total: count,
  };
}

describe("runOffersSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertOffers.mockImplementation(async (...args: unknown[]) => (args[0] as unknown[]).length);
  });

  it("upserts the whole snapshot and prunes afterwards", async () => {
    const result = await runOffersSync({ fetchOffers: async () => snapshot(240) });

    expect(result).toEqual({ recordsSynced: 240, removed: 0 });
    expect(upsertOffers).toHaveBeenCalledOnce();
    expect(deleteOffersSyncedBefore).toHaveBeenCalledOnce();
    expect(markSyncSucceeded).toHaveBeenCalledOnce();
  });

  it("keeps existing rows and records the failure when upstream breaks", async () => {
    const fetchOffers = async () => {
      throw new Error("ODWB rate limit reached");
    };

    await expect(runOffersSync({ fetchOffers })).rejects.toThrow("ODWB rate limit reached");

    expect(markSyncFailed).toHaveBeenCalledOnce();
    expect(markSyncSucceeded).not.toHaveBeenCalled();
    expect(upsertOffers).not.toHaveBeenCalled();
    expect(deleteOffersSyncedBefore).not.toHaveBeenCalled();
  });

  it("refuses an empty snapshot instead of wiping the mirror", async () => {
    await expect(runOffersSync({ fetchOffers: async () => snapshot(0) })).rejects.toThrow(
      "no offers"
    );

    expect(deleteOffersSyncedBefore).not.toHaveBeenCalled();
    expect(markSyncFailed).toHaveBeenCalledOnce();
  });
});
