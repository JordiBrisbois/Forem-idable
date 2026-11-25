// @vitest-environment node
import { beforeEach, expect, it } from "vitest";
import { normalizeOffer, type NormalizedOffer } from "./offers/normalize";
import {
  countOffers,
  countOffersByContractType,
  deleteOffersSyncedBefore,
  getOfferJob,
  getOfferPayload,
  getSyncState,
  markSyncFailed,
  markSyncStarted,
  markSyncSucceeded,
  searchOffers,
  upsertOffers,
} from "./offers/repository";
import { describeWithDatabase, resetDatabase } from "@/lib/server/testFixtures";

function offer(overrides: {
  id: string;
  title?: string;
  company?: string;
  contractType?: string;
  localities?: string[];
  postalCodes?: string[];
  region?: string;
  metier?: string;
  publication?: string;
}): NormalizedOffer {
  return normalizeOffer({
    numerooffreforem: overrides.id,
    titreoffre: overrides.title ?? `Offre ${overrides.id}`,
    nomemployeur: overrides.company ?? null,
    lieuxtravaillocalite: overrides.localities ?? [],
    lieuxtravailcodepostal: overrides.postalCodes ?? [],
    lieuxtravailregion: overrides.region ?? null,
    typecontrat: overrides.contractType ?? "Durée indéterminée",
    datedebutdiffusion: overrides.publication ?? "2026-10-01T09:00:00+00:00",
    url: `https://www.leforem.be/recherche-offres/offre-detail/${overrides.id}`,
    metier: overrides.metier ?? null,
  });
}

const syncedAt = new Date("2026-11-01T00:00:00Z");

describeWithDatabase("offers mirror (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("indexes offers and reads them back from the database", async () => {
    await upsertOffers(
      [
        offer({ id: "1", title: "Développeur React", localities: ["Namur"], postalCodes: ["5000"] }),
        offer({ id: "2", title: "Data analyst", localities: ["Liège"], postalCodes: ["4000"] }),
      ],
      syncedAt
    );

    expect(await countOffers()).toBe(2);

    const result = await searchOffers({ limit: 10, offset: 0 });
    expect(result.total).toBe(2);
    // Same publication date for both, so the tie-break is offer id descending.
    expect([...result.jobs.map((job) => job.id)].sort()).toEqual(["1", "2"]);
  });

  it("updates in place on re-sync instead of duplicating", async () => {
    await upsertOffers([offer({ id: "1", title: "Ancien titre" })], syncedAt);
    await upsertOffers([offer({ id: "1", title: "Nouveau titre" })], syncedAt);

    const result = await searchOffers({ limit: 10, offset: 0 });

    expect(result.total).toBe(1);
    expect(result.jobs[0].title).toBe("Nouveau titre");
  });

  it("filters on keywords, contract type and place", async () => {
    await upsertOffers(
      [
        offer({ id: "1", title: "Développeur React", contractType: "Durée indéterminée", localities: ["Namur"], postalCodes: ["5000"] }),
        offer({ id: "2", title: "Développeur Java", contractType: "Durée déterminée", localities: ["Liège"], postalCodes: ["4000"] }),
        offer({ id: "3", title: "Boulanger", contractType: "Durée indéterminée", localities: ["Namur"], postalCodes: ["5000"] }),
      ],
      syncedAt
    );

    const byKeyword = await searchOffers({ keywords: ["développeur"], limit: 10, offset: 0 });
    expect(byKeyword.jobs.map((job) => job.id).sort()).toEqual(["1", "2"]);

    const byContract = await searchOffers({ contractTypes: ["CDD"], limit: 10, offset: 0 });
    expect(byContract.jobs.map((job) => job.id)).toEqual(["2"]);

    const byPostal = await searchOffers({
      locations: [{ name: "5000 Namur", type: "Localités", postalCode: "5000" }],
      limit: 10,
      offset: 0,
    });
    expect(byPostal.jobs.map((job) => job.id).sort()).toEqual(["1", "3"]);

    const byRegion = await searchOffers({
      locations: [{ name: "Province de Liège", type: "Provinces" }],
      limit: 10,
      offset: 0,
    });
    expect(byRegion.jobs.map((job) => job.id)).toEqual(["2"]);
  });

  it("combines keyword mode AND and OR", async () => {
    await upsertOffers(
      [
        offer({ id: "1", title: "Développeur React", metier: "Informatique" }),
        offer({ id: "2", title: "Développeur Java", metier: "Informatique" }),
        offer({ id: "3", title: "React designer", metier: "Design" }),
      ],
      syncedAt
    );

    const or = await searchOffers({ keywords: ["react", "java"], booleanMode: "OR", limit: 10, offset: 0 });
    expect(or.jobs.map((job) => job.id).sort()).toEqual(["1", "2", "3"]);

    const and = await searchOffers({ keywords: ["react", "java"], booleanMode: "AND", limit: 10, offset: 0 });
    expect(and.jobs).toHaveLength(0);
  });

  it("paginates without losing the total", async () => {
    await upsertOffers(
      Array.from({ length: 5 }, (_, index) =>
        offer({ id: String(index + 1), publication: `2026-10-0${index + 1}T09:00:00+00:00` })
      ),
      syncedAt
    );

    const page = await searchOffers({ limit: 2, offset: 2 });

    expect(page.total).toBe(5);
    expect(page.jobs).toHaveLength(2);
    // Newest first: offset 2 lands on the third and fourth most recent.
    expect(page.jobs.map((job) => job.id)).toEqual(["3", "2"]);
  });

  it("exposes the raw payload for the detail view and shared messages", async () => {
    await upsertOffers([offer({ id: "1", title: "Développeur React", metier: "Informatique" })], syncedAt);

    const payload = await getOfferPayload("1");
    expect(payload?.titreoffre).toBe("Développeur React");

    const job = await getOfferJob("1");
    expect(job?.title).toBe("Développeur React");
    expect(await getOfferPayload("inconnu")).toBeNull();
    expect(await getOfferJob("inconnu")).toBeNull();
  });

  it("counts contract types and hides AUTRE", async () => {
    await upsertOffers(
      [
        offer({ id: "1", contractType: "Durée indéterminée" }),
        offer({ id: "2", contractType: "Durée indéterminée" }),
        offer({ id: "3", contractType: "Stage" }),
        offer({ id: "4", contractType: "Type inconnu" }),
      ],
      syncedAt
    );

    const counts = await countOffersByContractType();

    expect(counts).toEqual([
      { type: "CDI", count: 2 },
      { type: "STAGE", count: 1 },
    ]);
  });

  it("prunes only rows older than the sync cutoff", async () => {
    await upsertOffers([offer({ id: "old" })], new Date("2026-10-01T00:00:00Z"));
    await upsertOffers([offer({ id: "new" })], new Date("2026-11-02T00:00:00Z"));

    const removed = await deleteOffersSyncedBefore(new Date("2026-11-01T00:00:00Z"));

    expect(removed).toBe(1);
    expect(await countOffers()).toBe(1);
  });

  it("tracks the sync state so a failure is visible", async () => {
    await markSyncStarted(syncedAt);
    expect(await getSyncState()).toMatchObject({ status: "running", recordsSynced: 0 });

    await markSyncSucceeded(syncedAt, 42);
    expect(await getSyncState()).toMatchObject({ status: "success", recordsSynced: 42 });

    await markSyncFailed(syncedAt, "ODWB rate limit reached");
    expect(await getSyncState()).toMatchObject({
      status: "failed",
      errorMessage: "ODWB rate limit reached",
    });
  });
});
