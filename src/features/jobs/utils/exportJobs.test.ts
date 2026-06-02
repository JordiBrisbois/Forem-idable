import { buildExportMetadata, getExportScopeJobs } from "./exportJobs";
import { Job } from "@/types/job";
import { SearchQuery } from "@/types/search";

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

describe("getExportScopeJobs", () => {
  it("returns all jobs for target all", () => {
    const all = [makeJob("1"), makeJob("2")];
    const selected = [makeJob("2")];
    expect(getExportScopeJobs("all", all, selected)).toEqual(all);
  });

  it("returns selected jobs for target selected", () => {
    const all = [makeJob("1"), makeJob("2")];
    const selected = [makeJob("2")];
    expect(getExportScopeJobs("selected", all, selected)).toEqual(selected);
  });
});

describe("buildExportMetadata", () => {
  it("builds metadata with formatted labels", () => {
    const query: SearchQuery = {
      keywords: ["dev", "react"],
      booleanMode: "AND",
      locations: [{ id: "loc1", name: "4000 Liège", type: "Localités" }],
    };

    const metadata = buildExportMetadata({
      target: "selected",
      jobsCount: 3,
      searchQuery: query,
      now: new Date("2026-02-23T12:00:00Z"),
    });

    expect(metadata["Mots-clés"]).toBe("dev AND react");
    expect(metadata["Mode booléen"]).toBe("ET");
    expect(metadata["Nombre d'offres"]).toBe("3");
    expect(metadata["Portée export"]).toBe("Sélection");
    expect(metadata["Lieux"]).toContain("4000 Liège");
  });
});
