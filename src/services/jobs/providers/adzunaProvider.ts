import { fetchAdzunaJobs } from "@/services/api/adzunaClient";
import { ForemSearchParams } from "@/services/api/foremClient";
import { JobProvider } from "./types";

export const adzunaProvider: JobProvider = {
  id: "adzuna",
  search: async (params: ForemSearchParams) => fetchAdzunaJobs(params),
};

