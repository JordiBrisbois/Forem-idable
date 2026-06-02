import { dedupeAndSortJobs } from "./mergeJobs";
import { Job } from "@/types/job";

function makeJob(partial: Partial<Job>): Job {
  return {
    id: partial.id || "id",
    title: partial.title || "Titre",
    location: partial.location || "Liège",
    contractType: partial.contractType || "CDI",
    publicationDate: partial.publicationDate || "2026-01-01",
    url: partial.url || "https://example.com/a",
    source: partial.source || "forem",
    company: partial.company,
    description: partial.description,
    pdfUrl: partial.pdfUrl,
  };
}

describe("dedupeAndSortJobs", () => {
  it("deduplicates jobs using url/title/company/location signature", () => {
    const jobs: Job[] = [
      makeJob({ id: "1", url: "https://x", title: "Dev", company: "ACME", location: "Liège" }),
      makeJob({ id: "2", url: "https://x", title: "Dev", company: "ACME", location: "Liège" }),
      makeJob({ id: "3", url: "https://y", title: "QA", company: "ACME", location: "Namur" }),
    ];

    const result = dedupeAndSortJobs(jobs);
    expect(result).toHaveLength(2);
    expect(result.map((job) => job.id)).toEqual(["1", "3"]);
  });

  it("sorts by publication date descending", () => {
    const jobs: Job[] = [
      makeJob({ id: "a", publicationDate: "2026-01-01", url: "https://a" }),
      makeJob({ id: "b", publicationDate: "2026-03-01", url: "https://b" }),
      makeJob({ id: "c", publicationDate: "2025-12-01", url: "https://c" }),
    ];

    const result = dedupeAndSortJobs(jobs);
    expect(result.map((job) => job.id)).toEqual(["b", "a", "c"]);
  });
});

