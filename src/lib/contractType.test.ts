import { describe, expect, it } from "vitest";
import { normalizeContractType } from "@/lib/contractType";

describe("normalizeContractType", () => {
  // Real labels from the ODWB "offres-d-emploi-forem" dataset (with counts).
  it("maps the dataset's long French labels", () => {
    expect(normalizeContractType("Durée indéterminée")).toBe("CDI");
    expect(normalizeContractType("Durée Indéterminée")).toBe("CDI");
    expect(normalizeContractType("Durée déterminée")).toBe("CDD");
    expect(normalizeContractType("Intérimaire")).toBe("INTERIM");
    expect(normalizeContractType("Contrat collaboration indépendant")).toBe("FREELANCE");
  });

  it("prefers Intérim over the 'durée indéterminée' wording on intérim offers", () => {
    expect(
      normalizeContractType("Intérimaire avec option sur durée indéterminée")
    ).toBe("INTERIM");
  });

  it("still recognizes short codes and other sources", () => {
    expect(normalizeContractType("CDI")).toBe("CDI");
    expect(normalizeContractType("cdd")).toBe("CDD");
    expect(normalizeContractType("Stage étudiant")).toBe("STAGE");
    expect(normalizeContractType("Contrat d'apprentissage")).toBe("ALTERNANCE");
    expect(normalizeContractType("Freelance")).toBe("FREELANCE");
  });

  it("falls back to AUTRE for unknown or empty labels", () => {
    expect(normalizeContractType("Etudiant")).toBe("AUTRE");
    expect(normalizeContractType("Flexi-Jobs")).toBe("AUTRE");
    expect(normalizeContractType("")).toBe("AUTRE");
    expect(normalizeContractType(null)).toBe("AUTRE");
    expect(normalizeContractType(undefined)).toBe("AUTRE");
  });
});
