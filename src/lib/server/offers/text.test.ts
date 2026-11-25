import { describe, expect, it } from "vitest";
import { normalizeSearchText, searchTokens } from "./text";

describe("normalizeSearchText", () => {
  it("removes accents and lower-cases", () => {
    expect(normalizeSearchText("Développeur Full-Stack")).toBe("developpeur full-stack");
    expect(normalizeSearchText("ÉLECTROMÉCANICIEN")).toBe("electromecanicien");
    expect(normalizeSearchText("Namur, Beez")).toBe("namur, beez");
  });

  it("collapses whitespace and trims", () => {
    expect(normalizeSearchText("  technicien   de\n maintenance ")).toBe(
      "technicien de maintenance"
    );
  });

  it("keeps punctuation that carries meaning", () => {
    expect(normalizeSearchText("CDI/CDD")).toBe("cdi/cdd");
  });
});

describe("searchTokens", () => {
  it("splits a phrase into normalised tokens", () => {
    expect(searchTokens("Développeur  React")).toEqual(["developpeur", "react"]);
  });

  it("ignores blank input", () => {
    expect(searchTokens("   ")).toEqual([]);
  });
});
