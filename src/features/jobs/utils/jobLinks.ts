import { appendForemTrackingParam } from "@/lib/forem";
import { Job } from "@/types/job";

export function getForemOfferId(job: Job): string | null {
  if (job.id && /^\d+$/.test(job.id)) return job.id;
  if (!job.url) return null;

  const match = job.url.match(/offre-detail\/(\d+)/);
  return match?.[1] ?? null;
}

export function getJobPdfUrl(job: Job): string | null {
  if (job.pdfUrl) return job.pdfUrl;
  const offerId = getForemOfferId(job);
  return offerId ? `/api/pdf/${offerId}` : null;
}

export function getJobExternalUrl(job: Pick<Job, "url">): string {
  return appendForemTrackingParam(job.url);
}
