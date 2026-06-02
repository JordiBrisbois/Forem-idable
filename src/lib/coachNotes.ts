import {
  CoachNoteAuthor,
  JobApplication,
} from "@/types/application";
import { inferApplicationSourceType } from "@/lib/applications/sourceType";

export function toCoachNoteAuthor(input: {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "coach" | "admin";
}): CoachNoteAuthor {
  return {
    id: input.id,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    role: input.role,
  };
}

function dedupeContributors(contributors: CoachNoteAuthor[]) {
  const seen = new Set<number>();
  return contributors.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

export function normalizeApplicationCoachNotes(application: JobApplication): JobApplication {
  const privateCoachNote =
    application.privateCoachNote?.content.trim()
      ? {
          ...application.privateCoachNote,
          content: application.privateCoachNote.content.trim(),
          contributors: dedupeContributors(application.privateCoachNote.contributors ?? []),
        }
      : undefined;

  return {
    ...application,
    sourceType: inferApplicationSourceType(application),
    privateCoachNote,
    sharedCoachNotes: (application.sharedCoachNotes ?? [])
      .filter((entry) => entry.content.trim())
      .map((entry) => ({
        ...entry,
        content: entry.content.trim(),
        contributors: dedupeContributors(entry.contributors ?? []),
      })),
  };
}

export function sanitizeApplicationForBeneficiary(application: JobApplication): JobApplication {
  const normalized = normalizeApplicationCoachNotes(application);
  return {
    ...normalized,
    privateCoachNote: undefined,
  };
}

export function preserveApplicationCoachFields(existing: JobApplication | null, next: JobApplication) {
  const normalizedNext = normalizeApplicationCoachNotes(next);
  if (!existing) {
    return normalizedNext;
  }

  const normalizedExisting = normalizeApplicationCoachNotes(existing);
  return {
    ...normalizedNext,
    sourceType: normalizedNext.sourceType ?? normalizedExisting.sourceType,
    privateCoachNote: normalizedNext.privateCoachNote ?? normalizedExisting.privateCoachNote,
    sharedCoachNotes:
      normalizedNext.sharedCoachNotes && normalizedNext.sharedCoachNotes.length > 0
        ? normalizedNext.sharedCoachNotes
        : normalizedExisting.sharedCoachNotes,
  };
}

export function formatCoachAuthorName(author: CoachNoteAuthor) {
  return `${author.firstName} ${author.lastName}`.trim() || author.email || "Historique";
}

export function summarizeCoachContributors(contributors: CoachNoteAuthor[]) {
  return dedupeContributors(contributors).map(formatCoachAuthorName).join(", ");
}
