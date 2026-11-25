import { describe, expect, it } from "vitest";
import { normalizeOffer, toJob } from "./normalize";
import type { OdwbOfferRecord } from "./odwbRecord";

const baseRecord: OdwbOfferRecord = {
  numerooffreforem: 1836265,
  titreoffre: "Développeur full-stack",
  nomemployeur: "Le Forem",
  lieuxtravaillocalite: ["Namur", "Beez"],
  lieuxtravailcodepostal: ["5000", "5000"],
  lieuxtravailregion: "Province de Namur",
  typecontrat: "Durée indéterminée",
  datedebutdiffusion: "2026-10-01T09:00:00+00:00",
  url: "https://www.leforem.be/recherche-offres/offre-detail/1836265",
  metier: "Informatique",
};

describe("normalizeOffer", () => {
  it("maps the ODWB record to a mirror row", () => {
    const offer = normalizeOffer(baseRecord);

    expect(offer.offerId).toBe("1836265");
    expect(offer.title).toBe("Développeur full-stack");
    expect(offer.company).toBe("Le Forem");
    expect(offer.contractType).toBe("CDI");
    expect(offer.region).toBe("Province de Namur");
    expect(offer.localities).toEqual(["namur", "beez"]);
    expect(offer.locationLabel).toBe("Namur, Beez");
    expect(offer.postalCodes).toEqual(["5000", "5000"]);
    expect(offer.publicationDate?.toISOString()).toBe("2026-10-01T09:00:00.000Z");
    expect(offer.searchText).toContain("développeur full-stack");
    expect(offer.searchText).toContain("namur");
  });

  it("derives a stable id when the record has no offer number", () => {
    const withoutId = { ...baseRecord, numerooffreforem: null };

    const first = normalizeOffer(withoutId);
    const second = normalizeOffer({ ...withoutId });

    expect(first.offerId).toMatch(/^forem-fallback-/);
    expect(second.offerId).toBe(first.offerId);
  });

  it("falls back to a readable title and location", () => {
    const sparse = normalizeOffer({
      numerooffreforem: "42",
      titreoffre: null,
      lieuxtravaillocalite: null,
      url: null,
    });

    expect(sparse.title).toBe("Poste non spécifié");
    expect(sparse.localities).toEqual([]);
    expect(sparse.url).toContain("/offre-detail/42");
  });
});

describe("toJob", () => {
  it("rebuilds the client-facing job from a mirror row", () => {
    const offer = normalizeOffer(baseRecord);
    const job = toJob({
      offerId: offer.offerId,
      title: offer.title,
      company: offer.company,
      contractType: offer.contractType,
      locationLabel: offer.locationLabel,
      publicationDate: offer.publicationDate,
      url: offer.url,
      metier: offer.metier,
    });

    expect(job).toMatchObject({
      id: "1836265",
      title: "Développeur full-stack",
      company: "Le Forem",
      contractType: "CDI",
      location: "Namur, Beez",
      source: "forem",
    });
    expect(job.url).toContain("1836265");
  });
});
