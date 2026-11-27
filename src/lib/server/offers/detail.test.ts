import { describe, expect, it } from "vitest";
import {
  foremDetailUrl,
  htmlToText,
  normalizeForemDetail,
  normalizeMirrorDetail,
} from "./detail";

const foremPayload = {
  idOffreEmploi: 2164057,
  numero: "2164057",
  titreOffre: "Peintre carrossier (H/F/X)",
  nomEmployeur: "KONVERT",
  nomPartenaire: "Jobat",
  typeContrat: "Intérimaire",
  regimeTravail: "Temps plein",
  experience: "2 ans",
  secteurActiviteEmployeur: "Activités liées à l'emploi",
  descriptionJob: "<ul><li>Préparer les surfaces</li><li>Appliquer la peinture</li></ul>",
  commentaireGeneral: "<p>Tu possèdes une formation en <strong>carrosserie</strong>.</p>",
  howToApply: "<p>Envoyez votre CV à <a href='#'>l'employeur</a>.</p>",
  niveauxEtudes: [{ libelle: "Secondaire" }],
  langues: ["français"],
  permisConduire: ["B"],
  lieuxTravail: [{ libelle: "Namur" }],
  nombrePostes: 1,
  dateFinDiffusion: "24/12/2026",
  referenceOffrePartenaire: "15698063_FR",
  logoEmployeur: "A".repeat(90_000),
  googleForJobMetadata: { huge: "x".repeat(2_000) },
};

describe("foremDetailUrl", () => {
  it("targets the endpoint the Forem front-end itself uses", () => {
    expect(foremDetailUrl("2164057")).toBe(
      "https://www.leforem.be/recherche-offres/api/Diffusion/DetailOffre/2164057"
    );
  });
});

describe("htmlToText", () => {
  it("turns lists into readable bullets", () => {
    const text = htmlToText("<ul><li>Un</li><li>Deux</li></ul>");

    expect(text).toContain("• Un");
    expect(text).toContain("• Deux");
  });

  it("keeps paragraph breaks and strips tags", () => {
    const text = htmlToText("<p>Premier</p><p>Second</p><br/><strong>Fin</strong>");

    expect(text).toBe("Premier\n\nSecond\n\nFin");
  });

  it("decodes named and numeric entities", () => {
    expect(htmlToText("<p>Beaucoup d&#39;offres &amp; d&eacute;tails</p>")).toBe(
      "Beaucoup d'offres & détails"
    );
  });

  it("never leaves an executable tag behind", () => {
    const text = htmlToText('<p>Bonjour<script>alert("x")</script></p>');

    expect(text).toBe("Bonjour");
    expect(text).not.toContain("<script");
  });
});

describe("normalizeForemDetail", () => {
  it("keeps the description, the sections and the useful highlights", () => {
    const detail = normalizeForemDetail(foremPayload, "2164057");

    expect(detail.source).toBe("forem-detail-api");
    expect(detail.description).toBe("• Préparer les surfaces\n• Appliquer la peinture");
    expect(detail.sections.map((section) => section.title)).toContain("Comment postuler");
    expect(detail.highlights).toEqual(
      expect.arrayContaining([
        { label: "Employeur", value: "KONVERT" },
        { label: "Contrat", value: "Intérimaire" },
        { label: "Études", value: "Secondaire" },
        { label: "Lieu de travail", value: "Namur" },
        { label: "Référence Forem", value: "2164057" },
      ])
    );
  });

  it("drops the employer logo and the Google metadata", () => {
    const detail = normalizeForemDetail(foremPayload, "2164057");
    const serialized = JSON.stringify(detail);

    expect(serialized).not.toContain("A".repeat(100));
    expect(serialized).not.toContain("huge");
    expect(serialized.length).toBeLessThan(4_000);
  });

  it("falls back to the employer comment when there is no task list", () => {
    const detail = normalizeForemDetail(
      { ...foremPayload, descriptionJob: undefined },
      "2164057"
    );

    expect(detail.description).toContain("carrosserie");
  });
});

describe("normalizeMirrorDetail", () => {
  it("exposes the structured summary with the mirror source", () => {
    const detail = normalizeMirrorDetail(
      {
        numerooffreforem: "2164057",
        metier: "Peinture industrielle",
        regimetravail: "Temps plein",
        langues: ["français"],
        secteurs: "Activités liées à l'emploi",
        nombrepostes: 1,
      },
      "2164057"
    );

    expect(detail.source).toBe("mirror");
    expect(detail.sections).toEqual([]);
    expect(detail.description).toBe("Peinture industrielle");
    expect(detail.highlights).toEqual(
      expect.arrayContaining([
        { label: "Régime de travail", value: "Temps plein" },
        { label: "Langues", value: "français" },
        { label: "Secteurs", value: "Activités liées à l'emploi" },
      ])
    );
  });
});
