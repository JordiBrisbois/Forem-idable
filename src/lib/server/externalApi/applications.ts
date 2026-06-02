import { inferApplicationSourceType } from "@/lib/applications/sourceType";
import {
  getRelationalApplicationRecordById,
  getRelationalApplicationRecordByUserAndJob,
  listApplicationRecordsFromRelationalStoreByUsers,
  saveApplicationToRelationalStore,
} from "@/lib/server/applicationStore";
import {
  createTrackedApplicationForUser,
  deleteApplicationForUser,
  updateApplicationForUser,
} from "@/lib/server/applications";
import { canAccessCoachUser } from "@/lib/server/coach";
import { db } from "@/lib/server/db";
import { ApplicationPatchInput, normalizeApplicationPatch } from "@/lib/server/requestSchemas";
import {
  ExternalApiActor,
  ExternalApiApplicationDetail,
  ExternalApiApplicationsResponse,
  ExternalApiFilters,
  ExternalApiMutationResponse,
} from "@/types/externalApi";
import { JobApplication } from "@/types/application";
import { Job } from "@/types/job";
import {
  buildStats,
  isDue,
  isInterviewScheduled,
  loadDashboard,
  matchesApplicationFilters,
  normalizeLimit,
  normalizeOffset,
  sanitizeApplicationForList,
  toApplicationDetail,
  toApplicationRow,
} from "./core";

export async function getScopedApplicationRows(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
) {
  const dashboard = await loadDashboard(actor, {
    userId: filters.userId,
    groupId: filters.groupId,
    role: filters.role,
  });
  const usersById = new Map(dashboard.users.map((user) => [user.id, user]));
  let rows: import("@/types/externalApi").ExternalApiApplicationRow[];

  try {
    const records = await listApplicationRecordsFromRelationalStoreByUsers(
      dashboard.users.map((user) => user.id)
    );

    rows = records
      .map((record) => {
        const user = usersById.get(record.userId);
        return user ? toApplicationRow(record, user) : null;
      })
      .filter((row): row is import("@/types/externalApi").ExternalApiApplicationRow => Boolean(row));
  } catch {
    rows = dashboard.users.flatMap((user) =>
      user.applications.map((application, index) => ({
        applicationId: index + 1,
        userId: user.id,
        userEmail: user.email,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userRole: user.role,
        groupIds: user.groupIds,
        groupNames: user.groupNames,
        isFollowUpDue: isDue(
          application.status,
          application.followUpDueAt,
          application.followUpEnabled
        ),
        isInterviewScheduled: isInterviewScheduled(application.interviewAt),
        application,
      }))
    );
  }

  rows = rows.filter((row) => matchesApplicationFilters(row, filters));

  return { dashboard, rows, usersById };
}

export async function requireScopedUser(actor: ExternalApiActor, userId: number) {
  if (actor.role === "admin") return true;
  return canAccessCoachUser(actor, userId);
}

export function normalizeExternalJob(input: Partial<Job> & { id?: string; title?: string }) {
  return {
    id: input.id?.trim() || "",
    title: input.title?.trim() || "",
    company: input.company?.trim() || undefined,
    location: input.location?.trim() || "Non précisé",
    contractType: input.contractType?.trim() || "Non précisé",
    publicationDate: input.publicationDate?.trim() || new Date().toISOString(),
    url: input.url?.trim() || "#",
    description: input.description?.trim() || undefined,
    source: input.source ?? "forem",
    pdfUrl: input.pdfUrl?.trim() || undefined,
  } satisfies Job;
}

export async function persistApplicationRecord(record: { userId: number; position: number }, application: JobApplication) {  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await saveApplicationToRelationalStore(client, {
      userId: record.userId,
      position: record.position,
      application,
      sourceType: inferApplicationSourceType(application),
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getExternalApplications(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
): Promise<ExternalApiApplicationsResponse> {
  const { dashboard, rows } = await getScopedApplicationRows(actor, filters);
  const offset = normalizeOffset(filters.offset);
  const limit = normalizeLimit(filters.limit, 500);

  return {
    actor,
    stats: buildStats(dashboard.users),
    applications: rows
      .slice(offset, offset + limit)
      .map((row) => sanitizeApplicationForList(row, filters)),
  };
}

export async function getExternalApplicationDetail(
  actor: ExternalApiActor,
  applicationId: number
): Promise<ExternalApiApplicationDetail | null> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) return null;

  const dashboard = await loadDashboard(actor, { userId: record.userId });
  const user = dashboard.users.find((entry) => entry.id === record.userId);
  if (!user) return null;

  return toApplicationDetail(record, user);
}

export async function upsertExternalApplication(
  actor: ExternalApiActor,
  input: {
    match: { userId: number; jobId: string };
    data: Partial<
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
      >
    > & { job: Partial<Job> & { title: string } };
  }
): Promise<ExternalApiMutationResponse> {
  const allowed = await requireScopedUser(actor, input.match.userId);
  if (!allowed) throw new Error("Forbidden");

  const existing = await getRelationalApplicationRecordByUserAndJob(
    input.match.userId,
    input.match.jobId
  );

  if (!existing) {
    await createTrackedApplicationForUser({
      userId: input.match.userId,
      job: normalizeExternalJob({
        ...input.data.job,
        id: input.match.jobId,
      }),
      appliedAt: input.data.appliedAt,
      status: input.data.status,
      notes: input.data.notes ?? undefined,
      proofs: input.data.proofs ?? undefined,
      interviewAt: input.data.interviewAt ?? undefined,
      interviewDetails: input.data.interviewDetails ?? undefined,
    });

    if (
      input.data.followUpDueAt ||
      input.data.followUpEnabled !== undefined ||
      input.data.lastFollowUpAt
    ) {
      await updateApplicationForUser({
        userId: input.match.userId,
        jobId: input.match.jobId,
        patch: {
          followUpDueAt: input.data.followUpDueAt,
          followUpEnabled: input.data.followUpEnabled,
          lastFollowUpAt: input.data.lastFollowUpAt,
        },
      });
    }

    const detail = await getExternalApplicationDetail(
      actor,
      (await getRelationalApplicationRecordByUserAndJob(input.match.userId, input.match.jobId))
        ?.applicationId ?? 0
    );
    if (!detail) {
      throw new Error("Application not found");
    }

    return {
      actor,
      created: true,
      application: detail,
    };
  }

  await updateApplicationForUser({
    userId: input.match.userId,
    jobId: input.match.jobId,
    patch: {
      status: input.data.status,
      notes: input.data.notes,
      proofs: input.data.proofs,
      interviewAt: input.data.interviewAt,
      interviewDetails: input.data.interviewDetails,
      lastFollowUpAt: input.data.lastFollowUpAt,
      followUpDueAt: input.data.followUpDueAt,
      followUpEnabled: input.data.followUpEnabled,
      appliedAt: input.data.appliedAt,
      job: input.data.job
        ? {
            ...normalizeExternalJob({
              ...input.data.job,
              id: input.match.jobId,
            }),
          }
        : undefined,
    },
  });

  const detail = await getExternalApplicationDetail(actor, existing.applicationId);
  if (!detail) {
    throw new Error("Application not found");
  }

  return {
    actor,
    created: false,
    application: detail,
  };
}

export async function patchExternalApplication(
  actor: ExternalApiActor,
  applicationId: number,
  patch: ApplicationPatchInput
): Promise<ExternalApiMutationResponse> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");

  await updateApplicationForUser({
    userId: record.userId,
    jobId: record.jobId,
    patch: normalizeApplicationPatch(record.jobId, patch),
  });

  const detail = await getExternalApplicationDetail(actor, applicationId);
  if (!detail) throw new Error("Application not found");

  return { actor, application: detail };
}

export async function deleteExternalApplication(
  actor: ExternalApiActor,
  applicationId: number
) {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");

  await deleteApplicationForUser(record.userId, record.jobId);
}
