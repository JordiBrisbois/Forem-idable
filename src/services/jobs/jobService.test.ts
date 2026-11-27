import { describe, expect, it, vi } from "vitest";
import { Job } from "@/types/job";

vi.mock("@/config/runtime", () => ({
  runtimeConfig: { features: { jobSearch: true } },
}));

const foremJobs = [
  {
    id: "stage-1",
    title: "Stagiaire développeur",
    contractType: "STAGE",
    company: "ACME",
    location: "Liège",
    publicationDate: "2026-03-20T09:00:00.000Z",
    url: "https://example.test/1",
    description: "",
    source: "forem",
  },
  {
    id: "cdi-1",
    title: "Développeur",
    contractType: "CDI",
    company: "ACME",
    location: "Namur",
    publicationDate: "2026-03-19T09:00:00.000Z",
    url: "https://example.test/2",
    description: "",
    source: "forem",
  },
] as unknown as Job[];

const foremSearch = vi.fn(async (_params?: unknown) => ({ jobs: foremJobs, total: 42 }));
const adzunaSearch = vi.fn(async (_params?: unknown) => ({
  jobs: [
    {
      id: "adzuna-1",
      title: "Développeur React",
      contractType: "CDI",
      company: "Beta",
      location: "Bruxelles",
      publicationDate: "2026-03-21T09:00:00.000Z",
      url: "https://example.test/3",
      description: "",
      source: "adzuna",
    },
  ] as unknown as Job[],
  total: 1,
}));

vi.mock("./providers/foremProvider", () => ({
  foremProvider: { id: "forem", search: (params: unknown) => foremSearch(params as never) },
}));

vi.mock("./providers/adzunaProvider", () => ({
  adzunaProvider: { id: "adzuna", search: (params: unknown) => adzunaSearch(params as never) },
}));

import { jobService } from "./jobService";

describe("jobService.searchJobs", () => {
  it("keeps the primary order and appends the secondary source on page 1", async () => {
    const { jobs, total } = await jobService.searchJobs({});

    expect(jobs.map((job) => job.id)).toEqual(["stage-1", "cdi-1", "adzuna-1"]);
    // The total comes from the paginated mirror, not from the merged page.
    expect(total).toBe(42);
  });

  it("queries the secondary source only on the first page", async () => {
    adzunaSearch.mockClear();

    await jobService.searchJobs({ offset: 15, limit: 15 });

    expect(adzunaSearch).not.toHaveBeenCalled();
  });

  it("filters by normalized contract type", async () => {
    const { jobs } = await jobService.searchJobs({ contractTypes: ["STAGE"] });

    expect(jobs.map((job) => job.id)).toEqual(["stage-1"]);
  });

  it("survives a failing secondary source", async () => {
    adzunaSearch.mockRejectedValueOnce(new Error("adzuna down"));

    const { jobs } = await jobService.searchJobs({});

    expect(jobs.map((job) => job.id)).toEqual(["stage-1", "cdi-1"]);
  });
});
