import { Job } from "@/types/job";

export function dedupeAndSortJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  const unique: Job[] = [];

  for (const job of jobs) {
    const key = [
      job.url.toLowerCase(),
      job.title.toLowerCase(),
      (job.company || "").toLowerCase(),
      job.location.toLowerCase(),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(job);
  }

  unique.sort((a, b) => {
    const aDate = Date.parse(a.publicationDate || "");
    const bDate = Date.parse(b.publicationDate || "");
    const safeA = Number.isFinite(aDate) ? aDate : 0;
    const safeB = Number.isFinite(bDate) ? bDate : 0;
    return safeB - safeA;
  });

  return unique;
}

