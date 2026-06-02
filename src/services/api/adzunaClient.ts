import { post } from "@/lib/api/client";
import { ForemSearchParams } from "./foremClient";
import { Job } from "@/types/job";

interface AdzunaSearchResponse {
  jobs: Job[];
  total: number;
  enabled: boolean;
}

export async function fetchAdzunaJobs(
  params: ForemSearchParams
): Promise<{ jobs: Job[]; total: number }> {
  try {
    const { data } = await post<AdzunaSearchResponse>("/api/providers/adzuna/search", params);

    if (!data.enabled) {
      return { jobs: [], total: 0 };
    }

    return {
      jobs: Array.isArray(data.jobs) ? data.jobs : [],
      total: Number.isFinite(data.total) ? data.total : 0,
    };
  } catch (error) {
    console.error("Error fetching Adzuna jobs:", error);
    return { jobs: [], total: 0 };
  }
}
