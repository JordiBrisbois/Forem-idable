import { describe, expect, it, vi } from "vitest";
import { Job } from "@/types/job";

vi.mock("@/config/runtime", () => ({
  runtimeConfig: { features: { jobSearch: true } },
}));

const foremJobs = [
  {
    id: "stage-1",
    title: "Stagiaire développeur",
    contractType: "Stage étudiant",
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

vi.mock("./providers/foremProvider", () => ({
  foremProvider: { id: "forem", search: async () => ({ jobs: foremJobs, total: foremJobs.length }) },
}));

vi.mock("./providers/adzunaProvider", () => ({
  adzunaProvider: { id: "adzuna", search: async () => ({ jobs: [], total: 0 }) },
}));

import { jobService } from "./jobService";

describe("jobService.searchJobs", () => {
  it("returns everything when no contract type is selected", async () => {
    const { jobs } = await jobService.searchJobs({});
    expect(jobs.map((job) => job.id).sort()).toEqual(["cdi-1", "stage-1"]);
  });

  it("filters by normalized contract type (free-form labels matched)", async () => {
    const { jobs } = await jobService.searchJobs({ contractTypes: ["STAGE"] });
    expect(jobs.map((job) => job.id)).toEqual(["stage-1"]);
  });

  it("can select several contract types", async () => {
    const { jobs } = await jobService.searchJobs({ contractTypes: ["STAGE", "CDI"] });
    expect(jobs.map((job) => job.id).sort()).toEqual(["cdi-1", "stage-1"]);
  });
});
