import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  buildOfferFilters,
  datasetRegionLabel,
  escapeLikePattern,
  toPostgresArrayLiteral,
  type OfferSearchCriteria,
} from "./filters";
import { foremOffers } from "@/lib/server/schema";

const dialect = new PgDialect();

function compile(criteria: OfferSearchCriteria) {
  const where = buildOfferFilters(criteria);
  if (!where) return null;
  return dialect.sqlToQuery(where);
}

const emptyCriteria: OfferSearchCriteria = { limit: 10, offset: 0 };

describe("escapeLikePattern", () => {
  it("neutralises LIKE metacharacters", () => {
    expect(escapeLikePattern("100%_télétravail")).toBe("100\\%\\_télétravail");
    expect(escapeLikePattern("back\\slash")).toBe("back\\\\slash");
  });
});

describe("buildOfferFilters", () => {
  it("returns no restriction when nothing is selected", () => {
    expect(buildOfferFilters(emptyCriteria)).toBeUndefined();
  });

  it("ignores empty keyword and contract selections", () => {
    expect(
      buildOfferFilters({ ...emptyCriteria, keywords: ["", "   "], contractTypes: [] })
    ).toBeUndefined();
  });

  it("builds a clause for a keyword search", () => {
    expect(buildOfferFilters({ ...emptyCriteria, keywords: ["développeur"] })).toBeDefined();
  });

  it("builds a clause for a contract filter", () => {
    expect(buildOfferFilters({ ...emptyCriteria, contractTypes: ["CDI"] })).toBeDefined();
  });

  it("builds a clause for a locality and a region", () => {
    const locality = buildOfferFilters({
      ...emptyCriteria,
      locations: [{ name: "5000 Namur", type: "Localités", postalCode: "5000" }],
    });
    const region = buildOfferFilters({
      ...emptyCriteria,
      locations: [{ name: "Wallonie", type: "Régions" }],
    });

    expect(locality).toBeDefined();
    expect(region).toBeDefined();
  });

  it("adds no restriction for a country-wide selection", () => {
    expect(
      buildOfferFilters({
        ...emptyCriteria,
        locations: [{ name: "Belgique", type: "Pays" }],
      })
    ).toBeUndefined();
  });
});

describe("compiled SQL", () => {
  it("uses parameterised ILIKE for keywords", () => {
    const query = compile({ ...emptyCriteria, keywords: ["react"] });

    expect(query?.sql).toContain("ilike");
    expect(query?.params).toContain("%react%");
  });

  it("parameterises the contract list with IN", () => {
    const query = compile({ ...emptyCriteria, contractTypes: ["CDI", "CDD"] });

    expect(query?.sql).toContain("in (");
    expect(query?.params).toEqual(expect.arrayContaining(["CDI", "CDD"]));
  });

  it("uses array overlap with a cast for postal codes and localities", () => {
    const query = compile({
      ...emptyCriteria,
      locations: [{ name: "5000 Namur", type: "Communes", postalCode: "5000" }],
    });

    expect(query?.sql).toContain("&&");
    expect(query?.sql).toContain("::text[]");
    // One text parameter per array literal: `($1)::text[]`, never `($1,$2)::text[]`.
    expect(query?.params).toEqual(
      expect.arrayContaining(['{"5000"}', '{"namur"}'])
    );
  });

  it("escapes quotes in locality names inside the array literal", () => {
    expect(toPostgresArrayLiteral(['l"ille', "back\\slash"])).toBe(
      '{"l\\"ille","back\\\\slash"}'
    );
  });

  it("never interpolates a keyword into the SQL text", () => {
    const query = compile({ ...emptyCriteria, keywords: ["100%_x'--"] });

    expect(query?.sql).not.toContain("100%");
    expect(query?.params.join(" ")).toContain("100\\%\\_x");
  });

  it("qualifies columns with the table name", () => {
    const query = compile({ ...emptyCriteria, keywords: ["react"] });

    expect(query?.sql).toContain(foremOffers.title.name.length > 0 ? "forem_offers" : "");
  });
});

describe("datasetRegionLabel", () => {
  it("maps the UI wording to the dataset wording", () => {
    expect(datasetRegionLabel("wallonie")).toBe("wallonne");
    expect(datasetRegionLabel("Wallonie")).toBe("wallonne");
    expect(datasetRegionLabel("Flandre")).toBe("flamande");
    expect(datasetRegionLabel("Région de Bruxelles-Capitale")).toBe("bruxelles");
  });

  it("leaves other labels untouched", () => {
    expect(datasetRegionLabel("Province de Namur")).toBe("province de namur");
  });
});

describe("new filter criteria", () => {
  it("filters on the published work regime", () => {
    const query = compile({ ...emptyCriteria, regimes: ["Temps plein"] });

    expect(query?.sql).toContain("in (");
    expect(query?.params).toContain("Temps plein");
  });

  it("filters sectors and languages with array overlap", () => {
    const sectors = compile({ ...emptyCriteria, sectors: ["informatique"] });
    const languages = compile({ ...emptyCriteria, languages: ["francais"] });

    expect(sectors?.sql).toContain("&&");
    expect(sectors?.params).toContain('{"informatique"}');
    expect(languages?.params).toContain('{"francais"}');
  });

  it("ignores empty filter arrays", () => {
    expect(
      buildOfferFilters({ ...emptyCriteria, regimes: [], sectors: [], languages: [] })
    ).toBeUndefined();
  });
});

describe("around me", () => {
  it("compiles a haversine radius condition", () => {
    const query = compile({ ...emptyCriteria, near: { lat: 50.47, lon: 4.87, radiusKm: 25 } });

    expect(query?.sql).toContain("<= ");
    expect(query?.sql).toContain("radians");
    expect(query?.params).toEqual(expect.arrayContaining([50.47, 4.87, 25]));
  });
});