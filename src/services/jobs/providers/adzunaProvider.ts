import { fetchAdzunaJobs } from "@/services/api/adzunaClient";
import { JobSearchParams } from "@/services/jobs/searchParams";
import { JobProvider } from "./types";

export const adzunaProvider: JobProvider = {
  id: "adzuna",
  search: async (params: JobSearchParams) => fetchAdzunaJobs(params),
};

