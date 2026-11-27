import { Job } from "@/types/job";

function jobKey(job: Job): string {
  return [
    job.url.toLowerCase(),
    job.title.toLowerCase(),
    (job.company || "").toLowerCase(),
    job.location.toLowerCase(),
  ].join("|");
}

/**
 * Deduplicates jobs from several providers while preserving the incoming order.
 *
 * Order is the server's decision now: the mirror sorts by relevance or date, and
 * a client-side re-sort (the previous behaviour) silently undid the relevance
 * ranking.
 */
export function mergeUniqueJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  const unique: Job[] = [];

  for (const job of jobs) {
    const key = jobKey(job);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(job);
  }

  return unique;
}
