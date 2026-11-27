import { describe, expect, it } from "vitest";
import { Job } from "@/types/job";
import { mergeUniqueJobs } from "./mergeJobs";

function job(overrides: Partial<Job> & { id: string }): Job {
  return {
    title: `Offre ${overrides.id}`,
    location: "Liège",
    contractType: "CDI",
    publicationDate: "2026-03-20T09:00:00.000Z",
    url: `https://example.test/${overrides.id}`,
    source: "forem",
    ...overrides,
  } as Job;
}

describe("mergeUniqueJobs", () => {
  it("keeps the incoming order instead of re-sorting by date", () => {
    const result = mergeUniqueJobs([
      job({ id: "a", publicationDate: "2026-01-01T00:00:00.000Z" }),
      job({ id: "b", publicationDate: "2026-06-01T00:00:00.000Z" }),
    ]);

    // The server decided this order (relevance); the merge must not undo it.
    expect(result.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("drops duplicates on the same offer across providers", () => {
    const first = job({ id: "a", title: "Même offre", url: "https://example.test/same" });
    const duplicate = job({ id: "a-copy", title: "Même offre", url: "https://example.test/same" });

    const result = mergeUniqueJobs([first, duplicate]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});
