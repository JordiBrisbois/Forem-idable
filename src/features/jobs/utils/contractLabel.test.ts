import { describe, expect, it } from "vitest";
import { contractBadgeLabel } from "./contractLabel";

describe("contractBadgeLabel", () => {
  it("keeps the normalized bucket when it is meaningful", () => {
    expect(contractBadgeLabel({ contractType: "CDI", contractTypeRaw: "Durée indéterminée" })).toBe(
      "CDI"
    );
  });

  it("shows the published label when the bucket is AUTRE", () => {
    expect(
      contractBadgeLabel({ contractType: "AUTRE", contractTypeRaw: "Contrat de professionnalisation" })
    ).toBe("Contrat de professionnalisation");
  });

  it("falls back to the bucket when no raw label exists", () => {
    expect(contractBadgeLabel({ contractType: "AUTRE" })).toBe("AUTRE");
  });
});
