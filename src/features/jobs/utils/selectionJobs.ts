import { Job } from "@/types/job";

export function toggleSelectionJob(current: Job[], nextJob: Job): Job[] {
  const exists = current.some((job) => job.id === nextJob.id);
  if (exists) return current.filter((job) => job.id !== nextJob.id);
  return [...current, nextJob];
}
