import { dedupeAndPrependHistory, isSameSearchQuery } from "./searchHistory";
import { SearchHistoryEntry } from "@/features/jobs/types/searchHistory";
import { SearchQuery } from "@/types/search";

function query(overrides?: Partial<SearchQuery>): SearchQuery {
  return {
    keywords: ["dev"],
    locations: [{ id: "loc-1", name: "4000 Liège", type: "Localités" }],
    booleanMode: "OR",
    ...overrides,
  };
}

function entry(id: string, state: SearchQuery): SearchHistoryEntry {
  return { id, state, createdAt: "2026-01-01T00:00:00.000Z" };
}

describe("isSameSearchQuery", () => {
  it("returns true for equivalent queries", () => {
    expect(isSameSearchQuery(query(), query())).toBe(true);
  });

  it("returns false when locations differ", () => {
    expect(
      isSameSearchQuery(
        query(),
        query({ locations: [{ id: "loc-2", name: "Namur", type: "Localités" }] })
      )
    ).toBe(false);
  });
});

describe("dedupeAndPrependHistory", () => {
  it("prepends new entry and removes duplicates by query", () => {
    const q1 = query();
    const q2 = query({ keywords: ["qa"] });
    const current = [entry("a", q1), entry("b", q2)];
    const next = entry("c", q1);

    const result = dedupeAndPrependHistory(current, next, 8);
    expect(result.map((item) => item.id)).toEqual(["c", "b"]);
  });

  it("respects maxItems", () => {
    const current = [
      entry("1", query({ keywords: ["1"] })),
      entry("2", query({ keywords: ["2"] })),
      entry("3", query({ keywords: ["3"] })),
    ];
    const next = entry("4", query({ keywords: ["4"] }));
    const result = dedupeAndPrependHistory(current, next, 2);
    expect(result.map((item) => item.id)).toEqual(["4", "1"]);
  });
});

