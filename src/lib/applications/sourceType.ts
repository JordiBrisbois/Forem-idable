import type { JobApplication } from "@/types/application";
import type { Job } from "@/types/job";

export type ApplicationSourceType = "manual" | "tracked";

export function inferApplicationSourceType(input: {
  sourceType?: ApplicationSourceType | null;
  job: Pick<Job, "id" | "url">;
}): ApplicationSourceType {
  if (input.sourceType === "manual" || input.sourceType === "tracked") {
    return input.sourceType;
  }

  return input.job.url === "#" || input.job.id.startsWith("manual-") ? "manual" : "tracked";
}

export function isManualJob(job: Pick<Job, "id" | "url">, sourceType?: ApplicationSourceType | null) {
  return inferApplicationSourceType({ sourceType, job }) === "manual";
}

export function isManualApplication(application: Pick<JobApplication, "job"> & { sourceType?: ApplicationSourceType }) {
  return inferApplicationSourceType(application) === "manual";
}
