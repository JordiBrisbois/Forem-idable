import { describe, expect, it } from "vitest";
import { normalizeOffer } from "./normalize";
import { odwbOfferRecordSchema, odwbRecordsResponseSchema } from "./odwbRecord";

/**
 * Shape copied from a live ODWB response (2026-11-26). It is a regression guard:
 * `lieuxtravailregion` and `permisdeconduire` are arrays there, and typing them
 * as strings made every page fail validation while the sync reported a shape
 * error — i.e. the mirror stayed empty for reasons unrelated to the quota.
 */
const liveRecord = {
  numerooffreforem: "2142713",
  titreoffre: "Monteur.se / câbleur.se basse tension (H/F/X)",
  lieuxtravaillocalite: ["TOURNAI"],
  lieuxtravailregion: ["Belgique", "Province du Hainaut", "RÉGION WALLONNE"],
  lieuxtravailcodepostal: ["7500"],
  lieuxtravailregionnuts: ["BE32", "BE323", "BE3"],
  lieuxtravailgeo: [{ lon: 3.38, lat: 50.6 }],
  typecontrat: "Durée indéterminée",
  nomemployeur: "Exemple SA",
  regimetravail: "Temps plein",
  nombrepostes: 2,
  niveauxetudes: null,
  langues: null,
  permisdeconduire: ["B"],
  secteurs: ["Activités liées à l'emploi"],
  source: "Forem",
  referenceexterne: "",
  url: "https://www.leforem.be/recherche-offres/offre-detail/2142713",
  datedebutdiffusion: "2026-11-06",
  datefindiffusion: "2026-12-06",
  metier: "Électricité",
  metiercodedimeco: "",
};

describe("odwbOfferRecordSchema", () => {
  it("accepts the live record shape", () => {
    const parsed = odwbOfferRecordSchema.safeParse(liveRecord);

    expect(parsed.success).toBe(true);
  });

  it("accepts scalar variants of the list fields", () => {
    const parsed = odwbOfferRecordSchema.safeParse({
      ...liveRecord,
      lieuxtravailregion: "RÉGION WALLONNE",
      permisdeconduire: null,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a record whose offer number is a nested object", () => {
    const parsed = odwbOfferRecordSchema.safeParse({
      ...liveRecord,
      numerooffreforem: { value: "1" },
    });

    expect(parsed.success).toBe(false);
  });
});

describe("odwbRecordsResponseSchema", () => {
  it("parses a page and keeps the total", () => {
    const parsed = odwbRecordsResponseSchema.safeParse({
      total_count: 24065,
      results: [liveRecord],
    });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.total_count).toBe(24065);
  });
});

describe("normalizeOffer on the live shape", () => {
  it("joins the region array and keeps the display locality", () => {
    const parsed = odwbOfferRecordSchema.parse(liveRecord);
    const offer = normalizeOffer(parsed);

    expect(offer.offerId).toBe("2142713");
    expect(offer.region).toBe("Belgique, Province du Hainaut, RÉGION WALLONNE");
    expect(offer.localities).toEqual(["tournai"]);
    expect(offer.locationLabel).toBe("TOURNAI");
    expect(offer.postalCodes).toEqual(["7500"]);
    expect(offer.contractType).toBe("CDI");
    // Region text is searchable, so a "Wallonie" or "Hainaut" filter can match.
    expect(offer.searchText).toContain("wallonne");
    expect(offer.searchText).toContain("hainaut");
  });
});
