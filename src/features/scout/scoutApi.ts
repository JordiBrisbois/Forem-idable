import { get, post, del } from "@/lib/api/client";
import { ScoutJobCreateInput, ScoutJob, ScoutResult } from "./scoutSchemas";

export async function createScoutJob(input: ScoutJobCreateInput): Promise<{ jobId: number }> {
  const { data } = await post<{ jobId: number }>("/api/scout/jobs", input);
  return data;
}

export async function listScoutJobs(): Promise<{ jobs: ScoutJob[] }> {
  const { data } = await get<{ jobs: ScoutJob[] }>("/api/scout/jobs");
  return data;
}

export async function getScoutJob(jobId: number): Promise<{ job: ScoutJob; results: ScoutResult[] }> {
  const { data } = await get<{ job: ScoutJob; results: ScoutResult[] }>(`/api/scout/jobs/${jobId}`);
  return data;
}

export async function deleteScoutJob(jobId: number): Promise<void> {
  await del(`/api/scout/jobs/${jobId}`);
}

export function openScoutStream(jobId: number): EventSource {
  return new EventSource(`/api/scout/jobs/${jobId}/stream`);
}
