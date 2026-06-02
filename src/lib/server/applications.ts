import { addDays } from "date-fns";
import { normalizeContractType } from "@/lib/contractType";
import { inferApplicationSourceType, isManualJob } from "@/lib/applications/sourceType";
import { parseStoredJobApplication } from "@/lib/server/applicationSchemas";
import { db, ensureDatabase } from "@/lib/server/db";
import {
  listApplicationsFromRelationalStore,
  loadApplicationFromRelationalStore,
  saveApplicationToRelationalStore,
} from "@/lib/server/applicationStore";
import {
  preserveApplicationCoachFields,
  sanitizeApplicationForBeneficiary,
} from "@/lib/coachNotes";
import { ApplicationStatus, JobApplication } from "@/types/application";
import { Job } from "@/types/job";

function sanitizeText(value: string | undefined, fallback = "") {
  return (value || "").trim() || fallback;
}

function sanitizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim() || "";
  return trimmed || undefined;
}

function sanitizeUrl(value: string | undefined, fallback = "#") {
  const trimmed = value?.trim() || "";
  if (!trimmed) return fallback;

  if (trimmed === "#") return "#";

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function sanitizeJob(input: Job): Job {
  return {
    ...input,
    title: sanitizeText(input.title, "Sans intitulé"),
    company: sanitizeOptionalText(input.company),
    location: sanitizeText(input.location, "Non précisé"),
    contractType: normalizeContractType(input.contractType),
    url: sanitizeUrl(input.url, "#"),
  };
}

function sortApplicationsByAppliedAt(applications: JobApplication[]) {
  return [...applications].sort((left, right) => {
    const leftTime = new Date(left.appliedAt).getTime();
    const rightTime = new Date(right.appliedAt).getTime();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  });
}

function buildApplication(job: Job): JobApplication {
  const now = new Date();

  return {
    job,
    appliedAt: now.toISOString(),
    followUpDueAt: addDays(now, 7).toISOString(),
    followUpEnabled: true,
    status: "in_progress",
    updatedAt: now.toISOString(),
  };
}

async function getStoredApplication(userId: number, jobId: string) {  return loadApplicationFromRelationalStore(userId, jobId);
}

async function getNextPosition(userId: number) {
  const result = await db.query<{ next_position: number }>(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_position
     FROM applications
     WHERE user_id = $1`,
    [userId]
  );

  if (typeof result.rows[0]?.next_position === "number") {
    return result.rows[0].next_position;
  }
  return 0;
}

async function getApplicationPosition(userId: number, jobId: string) {
  const result = await db.query<{ position: number }>(
    `SELECT position
     FROM applications
     WHERE user_id = $1 AND job_id = $2
     LIMIT 1`,
    [userId, jobId]
  );

  if (typeof result.rows[0]?.position === "number") {
    return result.rows[0].position;
  }
  return null;
}

export async function listApplicationsForUser(userId: number) {
  await ensureDatabase();
  const relationalApplications = await listApplicationsFromRelationalStore(userId);
  return sortApplicationsByAppliedAt(
    relationalApplications.map((application) => sanitizeApplicationForBeneficiary(application))
  );
}

export async function createTrackedApplicationForUser(input: {
  userId: number;
  job: Job;
  appliedAt?: string;
  status?: ApplicationStatus;
  notes?: string;
  proofs?: string;
  interviewAt?: string;
  interviewDetails?: string;
}) {
  await ensureDatabase();
  const existing = await getStoredApplication(input.userId, input.job.id);
  const appliedAt = input.appliedAt ? new Date(input.appliedAt) : new Date();
  const normalizedAppliedAt = Number.isNaN(appliedAt.getTime()) ? new Date() : appliedAt;
  const sanitizedJob = sanitizeJob(input.job);

  const nextBase: JobApplication = existing
    ? {
        ...existing,
        job: sanitizedJob,
        sourceType: inferApplicationSourceType({ sourceType: existing.sourceType, job: sanitizedJob }),
        appliedAt: input.appliedAt ?? existing.appliedAt,
        status: input.status ?? existing.status,
        notes: input.notes?.trim() ?? existing.notes,
        proofs: input.proofs?.trim() ?? existing.proofs,
        interviewAt: input.interviewAt ?? existing.interviewAt,
        interviewDetails: input.interviewDetails?.trim() ?? existing.interviewDetails,
        followUpEnabled: existing.followUpEnabled !== false,
        updatedAt: new Date().toISOString(),
      }
    : {
        ...buildApplication(sanitizedJob),
        sourceType: inferApplicationSourceType({ job: sanitizedJob }),
        appliedAt: normalizedAppliedAt.toISOString(),
        followUpDueAt: addDays(normalizedAppliedAt, 7).toISOString(),
        followUpEnabled: true,
        status: input.status ?? "in_progress",
        notes: input.notes?.trim(),
        proofs: input.proofs?.trim(),
        interviewAt: input.interviewAt,
        interviewDetails: input.interviewDetails?.trim(),
        updatedAt: new Date().toISOString(),
      };

  const next = preserveApplicationCoachFields(existing, nextBase);
  parseStoredJobApplication(next, `write:user:${input.userId}:job:${input.job.id}`);
  const position = existing
    ? ((await getApplicationPosition(input.userId, input.job.id)) ?? 0)
    : await getNextPosition(input.userId);
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await saveApplicationToRelationalStore(client, {
      userId: input.userId,
      position,
      application: next,
      sourceType: inferApplicationSourceType(next),
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return sanitizeApplicationForBeneficiary(next);
}

export async function updateApplicationForUser(input: {
  userId: number;
  jobId: string;
  patch: Partial<
    Pick<
      JobApplication,
      | "status"
      | "notes"
      | "proofs"
      | "interviewAt"
      | "interviewDetails"
      | "lastFollowUpAt"
      | "followUpDueAt"
      | "followUpEnabled"
      | "appliedAt"
      | "job"
    >
  >;
}) {
  await ensureDatabase();
  const existing = await getStoredApplication(input.userId, input.jobId);
  if (!existing) {
    throw new Error("Application not found");
  }

  const nextPatch = { ...input.patch };
  if (nextPatch.job) {
    if (!isManualJob(existing.job)) {
      throw new Error("Manual job editing forbidden");
    }

    nextPatch.job = {
      ...existing.job,
      ...sanitizeJob(nextPatch.job),
      id: existing.job.id,
      source: existing.job.source,
      publicationDate: existing.job.publicationDate,
      pdfUrl: existing.job.pdfUrl,
      description: existing.job.description,
    };
  }

  if (typeof nextPatch.notes === "string") {
    nextPatch.notes = nextPatch.notes.trim();
  }

  if (typeof nextPatch.proofs === "string") {
    nextPatch.proofs = nextPatch.proofs.trim();
  }

  if (typeof nextPatch.interviewDetails === "string") {
    nextPatch.interviewDetails = nextPatch.interviewDetails.trim();
  }

  if (typeof nextPatch.followUpEnabled !== "boolean") {
    delete nextPatch.followUpEnabled;
  }

  const next = preserveApplicationCoachFields(existing, {
    ...existing,
    sourceType: inferApplicationSourceType({
      sourceType: existing.sourceType,
      job: nextPatch.job ?? existing.job,
    }),
    followUpEnabled: existing.followUpEnabled !== false,
    ...nextPatch,
    updatedAt: new Date().toISOString(),
  });
  parseStoredJobApplication(next, `write:user:${input.userId}:job:${input.jobId}`);
  const position = (await getApplicationPosition(input.userId, input.jobId)) ?? 0;

  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await saveApplicationToRelationalStore(client, {
      userId: input.userId,
      position,
      application: next,
      sourceType: inferApplicationSourceType(next),
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return sanitizeApplicationForBeneficiary(next);
}

export async function deleteApplicationForUser(userId: number, jobId: string) {
  await ensureDatabase();  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM applications
       WHERE user_id = $1 AND job_id = $2`,
      [userId, jobId]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
