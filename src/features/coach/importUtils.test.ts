import { describe, expect, it } from "vitest";
import {
  detectCoachImportFieldMapping,
  normalizeCoachImportedStatus,
} from "@/features/coach/importUtils";

describe("detectCoachImportFieldMapping", () => {
  it("matches french CSV headers with accents and spacing variations", () => {
    expect(
      detectCoachImportFieldMapping([
        "Entreprise",
        "Type de contrat",
        "Intitulé de poste",
        "Lieu",
        "Date d'envoi",
        "Statut",
        "Remarque",
      ])
    ).toEqual({
      company: "Entreprise",
      contractType: "Type de contrat",
      title: "Intitulé de poste",
      location: "Lieu",
      appliedAt: "Date d'envoi",
      status: "Statut",
      notes: "Remarque",
    });
  });
});

describe("normalizeCoachImportedStatus", () => {
  it("normalizes supported status labels", () => {
    expect(normalizeCoachImportedStatus("En cours")).toBe("in_progress");
    expect(normalizeCoachImportedStatus("À relancer")).toBe("follow_up");
    expect(normalizeCoachImportedStatus("Entretien")).toBe("interview");
    expect(normalizeCoachImportedStatus("Acceptée")).toBe("accepted");
    expect(normalizeCoachImportedStatus("Refusée")).toBe("rejected");
  });

  it("returns the provided fallback for unknown statuses", () => {
    expect(normalizeCoachImportedStatus("Mystère", "in_progress")).toBe("in_progress");
    expect(normalizeCoachImportedStatus("Mystère", "")).toBe("");
    expect(normalizeCoachImportedStatus("Mystère")).toBeUndefined();
  });
});
