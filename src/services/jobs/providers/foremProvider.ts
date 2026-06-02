import { fetchForemJobs, ForemSearchParams } from "@/services/api/foremClient";
import { JobProvider } from "./types";

export const foremProvider: JobProvider = {
  id: "forem",
  search: async (params: ForemSearchParams) => fetchForemJobs(params),
};

