import { toggleSelectionJob } from "./selectionJobs";
import { Job } from "@/types/job";

function makeJob(id: string): Job {
  return {
    id,
    title: `Job ${id}`,
    location: "Liège",
    contractType: "CDI",
    publicationDate: "2026-01-01",
    url: `https://example.com/${id}`,
    source: "forem",
  };
}

describe("toggleSelectionJob", () => {
  it("adds a job when absent", () => {
    const result = toggleSelectionJob([], makeJob("1"));
    expect(result.map((job) => job.id)).toEqual(["1"]);
  });

  it("removes a job when already selected", () => {
    const result = toggleSelectionJob([makeJob("1"), makeJob("2")], makeJob("1"));
    expect(result.map((job) => job.id)).toEqual(["2"]);
  });

  it("adds beyond three items when selection keeps growing", () => {
    const seed = [makeJob("1"), makeJob("2"), makeJob("3")];
    const result = toggleSelectionJob(seed, makeJob("999"));
    expect(result).toHaveLength(4);
    expect(result.map((job) => job.id)).toContain("999");
  });
});
