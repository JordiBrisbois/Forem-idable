import type { Job } from "@/types/job";

/**
 * Badge label for a job's contract.
 *
 * The mirror normalizes free-form upstream labels into a small bucket; when the
 * label matches none of them the bucket is `AUTRE`, which tells the user nothing.
 * In that case the raw published label is more useful than "Autre".
 */
export function contractBadgeLabel(job: Pick<Job, "contractType" | "contractTypeRaw">): string {
  if (job.contractType === "AUTRE" && job.contractTypeRaw) {
    return job.contractTypeRaw;
  }

  return job.contractType;
}
