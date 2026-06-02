import { randomUUID } from "crypto";
import { inferApplicationSourceType } from "@/lib/applications/sourceType";
import {
  listApplicationsFromRelationalStoreByUsers,
  loadApplicationFromRelationalStore,
  saveApplicationToRelationalStore,
} from "@/lib/server/applicationStore";
import {
  normalizeApplicationCoachNotes,
  toCoachNoteAuthor,
} from "@/lib/coachNotes";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { db, ensureDatabase } from "@/lib/server/db";
import {
  assertCanAccessCoachUser,
  markCoachAction,
  type CoachCapableUser,
} from "@/lib/server/coachGroups";
import { ApplicationPatchInput, normalizeApplicationPatch } from "@/lib/server/requestSchemas";
import { logServerEvent } from "@/lib/server/observability";
import {
  createTrackedApplicationForUser,
  deleteApplicationForUser,
  updateApplicationForUser,
} from "@/lib/server/applications";
import { CoachNoteAuthor, CoachSharedNote, JobApplication } from "@/types/application";
import { normalizeCoachImportedStatus } from "@/features/coach/importUtils";
import { Job } from "@/types/job";

function withContributor<T extends { contributors: CoachNoteAuthor[] }>(
  note: T,
  actor: CoachNoteAuthor
) {
  const alreadyContributor = note.contributors.some((entry) => entry.id === actor.id);
  return {
    ...note,
    contributors: alreadyContributor ? note.contributors : [...note.contributors, actor],
  };
}

export async function updateCoachApplicationNotes(input: {
  actor: CoachCapableUser;
  userId: number;
  jobId: string;
  privateNoteContent?: string;
  sharedNoteId?: string;
  sharedNoteContent?: string;
  createSharedNote?: boolean;
  deleteSharedNote?: boolean;
}) {
  await ensureDatabase();  await assertCanAccessCoachUser(input.actor, input.userId);
  const actor = toCoachNoteAuthor(input.actor);
  const relational = await loadApplicationFromRelationalStore(input.userId, input.jobId);
  const existing = relational;
  if (!existing) {
    throw new Error("Application not found");
  }

  const normalizedExisting = normalizeApplicationCoachNotes(existing);
  const now = new Date().toISOString();
  const nextApplication: JobApplication = {
    ...normalizedExisting,
    updatedAt: now,
  };

  if (typeof input.privateNoteContent === "string") {
    const trimmedPrivate = input.privateNoteContent.trim();

    nextApplication.privateCoachNote = trimmedPrivate
      ? withContributor(
          {
            content: trimmedPrivate,
            createdAt: normalizedExisting.privateCoachNote?.createdAt ?? now,
            updatedAt: now,
            createdBy: normalizedExisting.privateCoachNote?.createdBy ?? actor,
            contributors: normalizedExisting.privateCoachNote?.contributors ?? [actor],
          },
          actor
        )
      : undefined;
  }

  if (input.createSharedNote) {
    const trimmedShared = input.sharedNoteContent?.trim() ?? "";
    if (!trimmedShared) {
      throw new Error("Shared note content required");
    }

    const sharedNote: CoachSharedNote = {
      id: randomUUID(),
      content: trimmedShared,
      createdAt: now,
      updatedAt: now,
      createdBy: actor,
      contributors: [actor],
    };

    nextApplication.sharedCoachNotes = [
      ...(normalizedExisting.sharedCoachNotes ?? []),
      sharedNote,
    ];
  }

  if (input.sharedNoteId && typeof input.sharedNoteContent === "string" && !input.createSharedNote) {
    const trimmedShared = input.sharedNoteContent.trim();
    nextApplication.sharedCoachNotes = (normalizedExisting.sharedCoachNotes ?? [])
      .map((note) =>
        note.id === input.sharedNoteId
          ? withContributor(
              {
                ...note,
                content: trimmedShared,
                updatedAt: now,
              },
              actor
            )
          : note
      )
      .filter((note) => note.content.trim());
  }

  if (input.sharedNoteId && input.deleteSharedNote) {
    nextApplication.sharedCoachNotes = (normalizedExisting.sharedCoachNotes ?? []).filter(
      (note) => note.id !== input.sharedNoteId
    );
  }

  const positionResult = await db.query<{ position: number }>(
    `SELECT position
     FROM applications
     WHERE user_id = $1 AND job_id = $2
     LIMIT 1`,
    [input.userId, input.jobId]
  );
  const position = positionResult.rows[0]?.position ?? 0;
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await saveApplicationToRelationalStore(client, {
      userId: input.userId,
      position,
      application: nextApplication,
      sourceType: inferApplicationSourceType(nextApplication),
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await markCoachAction(input.actor.id);

  return normalizeApplicationCoachNotes(nextApplication);
}

export interface CoachImportedApplicationInput {
  company: string;
  contractType?: string;
  title: string;
  location?: string;
  appliedAt?: string;
  status?: JobApplication["status"];
  notes?: string;
}

export type CoachImportDateFormat = "dmy" | "mdy";

function normalizeImportedDate(value?: string, dateFormat: CoachImportDateFormat = "dmy") {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const delimitedMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/);
  if (delimitedMatch) {
    const [, first, second, year] = delimitedMatch;
    const day = dateFormat === "mdy" ? second : first;
    const month = dateFormat === "mdy" ? first : second;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    const isoCandidate = `${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const parsed = new Date(`${isoCandidate}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function buildImportedManualJob(
  input: CoachImportedApplicationInput,
  dateFormat: CoachImportDateFormat
): Job {
  const appliedAt = normalizeImportedDate(input.appliedAt, dateFormat) ?? new Date().toISOString();
  const fingerprint = `${input.company}|${input.title}|${appliedAt}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return {
    id: `manual-import-${fingerprint || Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    company: input.company.trim(),
    location: input.location?.trim() || "Non précisé",
    contractType: input.contractType?.trim() || "Non précisé",
    publicationDate: appliedAt,
    url: "#",
    source: "forem",
  };
}

export async function importCoachApplicationsForUser(input: {
  actor: CoachCapableUser;
  userId: number;
  rows: CoachImportedApplicationInput[];
  dateFormat?: CoachImportDateFormat;
}) {
  await ensureDatabase();  await assertCanAccessCoachUser(input.actor, input.userId);

  const importedApplications: JobApplication[] = [];
  let createdCount = 0;
  let updatedCount = 0;
  let ignoredCount = 0;
  const seenJobIds = new Set<string>();

  const dateFormat = input.dateFormat ?? "dmy";

  for (const row of input.rows) {
    if (!row.company.trim() || !row.title.trim()) {
      ignoredCount += 1;
      continue;
    }

    const job = buildImportedManualJob(row, dateFormat);
    if (seenJobIds.has(job.id)) {
      ignoredCount += 1;
      continue;
    }
    seenJobIds.add(job.id);

    const existed = Boolean(await loadApplicationFromRelationalStore(input.userId, job.id));

    const application = await createTrackedApplicationForUser({
      userId: input.userId,
      job,
      appliedAt: normalizeImportedDate(row.appliedAt, dateFormat),
      status: normalizeCoachImportedStatus(row.status) ?? "in_progress",
      notes: row.notes?.trim(),
    });

    importedApplications.push(application);
    if (existed) {
      updatedCount += 1;
    } else {
      createdCount += 1;
    }
  }

  await markCoachAction(input.actor.id);
  await recordAuditEvent({
    actorUserId: input.actor.id,
    action: "coach_csv_import_completed",
    targetUserId: input.userId,
    payload: {
      createdCount,
      updatedCount,
      ignoredCount,
      importedCount: importedApplications.length,
    },
  });
  logServerEvent({
    category: "coach",
    action: "csv_import_completed",
    meta: {
      actorUserId: input.actor.id,
      targetUserId: input.userId,
      createdCount,
      updatedCount,
      ignoredCount,
      importedCount: importedApplications.length,
    },
  });

  return {
    applications: importedApplications,
    createdCount,
    updatedCount,
    ignoredCount,
  };
}

export async function updateCoachManagedApplication(input: {
  actor: CoachCapableUser;
  userId: number;
  jobId: string;
  patch: ApplicationPatchInput;
}) {
  await assertCanAccessCoachUser(input.actor, input.userId);

  const application = await updateApplicationForUser({
    userId: input.userId,
    jobId: input.jobId,
    patch: normalizeApplicationPatch(input.jobId, input.patch),
  });

  await markCoachAction(input.actor.id);

  return application;
}

export async function deleteCoachManagedApplication(input: {
  actor: CoachCapableUser;
  userId: number;
  jobId: string;
}) {
  await assertCanAccessCoachUser(input.actor, input.userId);
  await deleteApplicationForUser(input.userId, input.jobId);
  await markCoachAction(input.actor.id);
}

export async function listCoachDashboardApplications(userIds: number[]) {
  return listApplicationsFromRelationalStoreByUsers(userIds);
}
