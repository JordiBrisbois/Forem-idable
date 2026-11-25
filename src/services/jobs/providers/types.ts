import { Job } from "@/types/job";
import { JobSearchParams } from "@/services/jobs/searchParams";

export interface ProviderSearchResult {
  jobs: Job[];
  total: number;
}

export interface JobProvider {
  id: string;
  search: (params: JobSearchParams) => Promise<ProviderSearchResult>;
}

