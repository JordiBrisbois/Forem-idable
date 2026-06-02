import { differenceInCalendarDays, format, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { CoachNoteAuthor, JobApplication } from "@/types/application";
import { CoachUserSummary } from "@/types/coach";

export function getCoachUserDisplayName(
  user: Pick<CoachUserSummary, "firstName" | "lastName" | "email">
) {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

export function formatCoachAuthorName(
  author: Pick<CoachNoteAuthor, "firstName" | "lastName" | "email">
) {
  return `${author.firstName} ${author.lastName}`.trim() || author.email || "Historique";
}

export function summarizeCoachContributors(contributors: CoachNoteAuthor[]) {
  const seen = new Set<number>();
  return contributors
    .filter((entry) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    })
    .map((entry) => formatCoachAuthorName(entry))
    .join(", ");
}

export function formatCoachDate(value?: string | null, withTime = false) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, withTime ? "dd MMM yyyy 'a' HH:mm" : "dd MMM yyyy", { locale: fr });
}

export function coachStatusLabel(status: JobApplication["status"]) {
  switch (status) {
    case "accepted":
      return "Acceptée";
    case "rejected":
      return "Refusée";
    case "follow_up":
      return "Relance à faire";
    case "interview":
      return "Entretien";
    case "in_progress":
    default:
      return "En cours";
  }
}

export function isApplicationDue(application: JobApplication) {
  const due = new Date(application.followUpDueAt);
  return (
    (application.status === "in_progress" || application.status === "follow_up") &&
    application.followUpEnabled !== false &&
    !Number.isNaN(due.getTime()) &&
    !isAfter(due, new Date())
  );
}

export function isTrackedCoachBeneficiary(user: CoachUserSummary) {
  if (user.role === "coach") return false;
  return user.role === "user" || user.groupIds.length > 0;
}

export function isCoachUserInactive(user: CoachUserSummary, now = new Date()) {
  if (!isTrackedCoachBeneficiary(user) || user.applicationCount === 0) {
    return false;
  }

  if (user.acceptedCount > 0) {
    return false;
  }

  const activeCount = user.inProgressCount + user.dueCount + user.interviewCount;
  if (activeCount === 0) {
    return false;
  }

  const latestActivity = parseTimestamp(user.latestActivityAt);
  if (latestActivity === null) {
    return true;
  }

  return differenceInCalendarDays(now, new Date(latestActivity)) >= 14;
}

export function parseTimestamp(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function toEditableDate(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function toEditableDateTime(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 16);
}

export function toIsoDate(value: string) {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function toIsoDateTime(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
