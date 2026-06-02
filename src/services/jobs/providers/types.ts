import { Job } from "@/types/job";
import { ForemSearchParams } from "@/services/api/foremClient";

export interface ProviderSearchResult {
  jobs: Job[];
  total: number;
}

export interface JobProvider {
  id: string;
  search: (params: ForemSearchParams) => Promise<ProviderSearchResult>;
}

