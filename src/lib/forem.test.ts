import { describe, expect, it } from "vitest";
import { appendForemTrackingParam } from "@/lib/forem";

describe("appendForemTrackingParam", () => {
  it("adds utm_source to Forem offer URLs", () => {
    expect(
      appendForemTrackingParam(
        "https://www.leforem.be/recherche-offres/offre-detail/1836265",
        "https://app.example.test"
      )
    ).toBe(
      "https://www.leforem.be/recherche-offres/offre-detail/1836265?utm_source=https%3A%2F%2Fapp.example.test"
    );
  });

  it("leaves non-Forem URLs unchanged", () => {
    expect(
      appendForemTrackingParam("https://example.test/jobs/1", "https://app.example.test")
    ).toBe(
      "https://example.test/jobs/1"
    );
  });
});
