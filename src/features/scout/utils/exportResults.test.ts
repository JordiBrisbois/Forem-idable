import { describe, expect, it } from "vitest";

import type { ScoutResult } from "@/features/scout/scoutSchemas";
import {
  buildScoutExportRows,
  SCOUT_EXPORT_COLUMNS,
  scoutExportFileName,
  toDelimitedText,
} from "@/features/scout/utils/exportResults";

function buildResult(overrides: Partial<ScoutResult> = {}): ScoutResult {
  return {
    id: 1,
    name: "Boulangerie Dupont",
    type: "bakery",
    email: "contact@dupont.be",
    website: "https://dupont.be",
    phone: "+32 4 123 45 67",
    address: "Rue de la Paix 1",
    lat: "50.63",
    lon: "5.58",
    town: "Liège",
    emailSource: "scraped",
    allEmails: [],
    osmId: 42,
    ...overrides,
  };
}

describe("buildScoutExportRows", () => {
  it("starts with the header row", () => {
    const [header] = buildScoutExportRows([buildResult()]);

    expect(header).toEqual(SCOUT_EXPORT_COLUMNS.map((column) => column.header));
  });

  it("renders one row per result, in column order", () => {
    const rows = buildScoutExportRows([buildResult()]);

    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual([
      "Boulangerie Dupont",
      "bakery",
      "contact@dupont.be",
      "+32 4 123 45 67",
      "https://dupont.be",
      "Rue de la Paix 1",
      "Liège",
      "scraped",
    ]);
  });

  it("exports empty cells for missing optional values", () => {
    const rows = buildScoutExportRows([
      buildResult({ email: null, phone: null, website: null, address: null, town: null }),
    ]);

    expect(rows[1].slice(2, 7)).toEqual(["", "", "", "", ""]);
  });

  it("keeps the header even when there is nothing to export", () => {
    expect(buildScoutExportRows([])).toEqual([SCOUT_EXPORT_COLUMNS.map((column) => column.header)]);
  });
});

describe("toDelimitedText", () => {
  it("joins cells with a semicolon and rows with a newline", () => {
    expect(toDelimitedText([["a", "b"], ["c", "d"]])).toBe("a;b\nc;d");
  });

  it("quotes cells containing the delimiter", () => {
    expect(toDelimitedText([["Rue de la Paix; 1"]])).toBe('"Rue de la Paix; 1"');
  });

  it("escapes double quotes by doubling them", () => {
    expect(toDelimitedText([['Le "bon" pain']])).toBe('"Le ""bon"" pain"');
  });

  it("quotes cells containing line breaks", () => {
    expect(toDelimitedText([["ligne 1\nligne 2"]])).toBe('"ligne 1\nligne 2"');
    expect(toDelimitedText([["ligne 1\rligne 2"]])).toBe('"ligne 1\rligne 2"');
  });

  it("supports another delimiter", () => {
    expect(toDelimitedText([["a,b", "c"]], ",")).toBe('"a,b",c');
  });

  it("leaves plain values untouched", () => {
    expect(toDelimitedText([["Liège", "5000"]])).toBe("Liège;5000");
  });
});

describe("scoutExportFileName", () => {
  const date = new Date("2026-10-29T21:20:00.000Z");

  it("uses the ISO date and the xlsx extension for Excel", () => {
    expect(scoutExportFileName("excel", date)).toBe("scout-resultats-2026-10-29.xlsx");
  });

  it("uses the csv extension for CSV", () => {
    expect(scoutExportFileName("csv", date)).toBe("scout-resultats-2026-10-29.csv");
  });
});
