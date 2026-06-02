import { get, post, patch as patchRequest, del } from "@/lib/api/client";
import { JobApplication, JobApplicationPatch } from "@/types/application";
import { Job } from "@/types/job";

export function fetchApplications() {
  return get<{ applications?: JobApplication[] }>("/api/applications", { cache: "no-store" });
}

export function createApplication(payload: {
  job: Job;
  appliedAt?: string;
  status?: string;
  notes?: string;
  proofs?: string;
  interviewAt?: string;
  interviewDetails?: string;
}) {
  return post<{ application?: JobApplication }>("/api/applications", payload);
}

export function patchApplication(jobId: string, patch: JobApplicationPatch) {
  return patchRequest<{ application?: JobApplication }>(
    `/api/applications/${encodeURIComponent(jobId)}`,
    { patch }
  );
}

export function deleteApplication(jobId: string) {
  return del<Record<string, never>>(`/api/applications/${encodeURIComponent(jobId)}`);
}
