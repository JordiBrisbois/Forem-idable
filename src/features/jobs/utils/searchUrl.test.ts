import { describe, expect, it } from "vitest";
import { fromSearchParams, toSearchParams } from "./searchUrl";
import { SearchQuery } from "@/types/search";

describe("searchUrl utils", () => {
  it("serializes and parses a full search query", () => {
    const query: SearchQuery = {
      keywords: ["dev", "react"],
      booleanMode: "AND",
      locations: [{ id: "loc-1", name: "4000 Liège", type: "Localités" }],
    };

    const params = toSearchParams(query);
    const parsed = fromSearchParams(params);

    expect(parsed).toEqual(query);
  });

  it("returns null when no keyword and no location are provided", () => {
    const params = new URLSearchParams();
    params.set("bm", "AND");

    expect(fromSearchParams(params)).toBeNull();
  });

  it("preserves location metadata required for advanced filters", () => {
    const query: SearchQuery = {
      keywords: ["administratif"],
      booleanMode: "OR",
      locations: [
        {
          id: "arr-1",
          name: "Arrondissement de Verviers",
          type: "Arrondissements",
          code: "63079",
          level: 3,
        },
      ],
    };

    const parsed = fromSearchParams(toSearchParams(query));
    expect(parsed).toEqual(query);
  });
});
