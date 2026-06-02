import { randomUUID } from "crypto";
import {
  toCoachNoteAuthor,
} from "@/lib/coachNotes";
import {
  getRelationalApplicationRecordById,
} from "@/lib/server/applicationStore";
import { ExternalApiActor, ExternalApiMutationResponse } from "@/types/externalApi";
import { JobApplication } from "@/types/application";
import { persistApplicationRecord, requireScopedUser, getExternalApplicationDetail } from "./applications";

export async function saveExternalPrivateNote(
  actor: ExternalApiActor,
  applicationId: number,
  content: string
): Promise<ExternalApiMutationResponse> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");
  const author = toCoachNoteAuthor(actor);
  const now = new Date().toISOString();
  const nextApplication: JobApplication = {
    ...record.application,
    privateCoachNote: content.trim()
      ? {
          content: content.trim(),
          createdAt: record.application.privateCoachNote?.createdAt ?? now,
          updatedAt: now,
          createdBy: record.application.privateCoachNote?.createdBy ?? author,
          contributors: record.application.privateCoachNote?.contributors?.some(
            (entry) => entry.id === author.id
          )
            ? (record.application.privateCoachNote?.contributors ?? [])
            : [...(record.application.privateCoachNote?.contributors ?? []), author],
        }
      : undefined,
    updatedAt: now,
  };
  await persistApplicationRecord(record, nextApplication);

  const detail = await getExternalApplicationDetail(actor, applicationId);
  if (!detail) throw new Error("Application not found");

  return { actor, application: detail };
}

export async function createExternalSharedNote(
  actor: ExternalApiActor,
  applicationId: number,
  content: string
): Promise<ExternalApiMutationResponse> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");
  if (!content.trim()) throw new Error("Shared note content required");
  const author = toCoachNoteAuthor(actor);
  const now = new Date().toISOString();
  const nextApplication: JobApplication = {
    ...record.application,
    sharedCoachNotes: [
      ...(record.application.sharedCoachNotes ?? []),
      {
        id: randomUUID(),
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
        createdBy: author,
        contributors: [author],
      },
    ],
    updatedAt: now,
  };
  await persistApplicationRecord(record, nextApplication);

  const detail = await getExternalApplicationDetail(actor, applicationId);
  if (!detail) throw new Error("Application not found");

  return { actor, application: detail };
}

export async function updateExternalSharedNote(
  actor: ExternalApiActor,
  applicationId: number,
  noteId: string,
  content: string
): Promise<ExternalApiMutationResponse> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");
  const author = toCoachNoteAuthor(actor);
  const now = new Date().toISOString();
  const nextApplication: JobApplication = {
    ...record.application,
    sharedCoachNotes: (record.application.sharedCoachNotes ?? [])
      .map((note) =>
        note.id === noteId
          ? {
              ...note,
              content: content.trim(),
              updatedAt: now,
              contributors: note.contributors.some((entry) => entry.id === author.id)
                ? note.contributors
                : [...note.contributors, author],
            }
          : note
      )
      .filter((note) => note.content.trim()),
    updatedAt: now,
  };
  await persistApplicationRecord(record, nextApplication);

  const detail = await getExternalApplicationDetail(actor, applicationId);
  if (!detail) throw new Error("Application not found");

  return { actor, application: detail };
}

export async function deleteExternalSharedNote(
  actor: ExternalApiActor,
  applicationId: number,
  noteId: string
): Promise<ExternalApiMutationResponse> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");
  const nextApplication: JobApplication = {
    ...record.application,
    sharedCoachNotes: (record.application.sharedCoachNotes ?? []).filter((note) => note.id !== noteId),
    updatedAt: new Date().toISOString(),
  };
  await persistApplicationRecord(record, nextApplication);

  const detail = await getExternalApplicationDetail(actor, applicationId);
  if (!detail) throw new Error("Application not found");

  return { actor, application: detail };
}
