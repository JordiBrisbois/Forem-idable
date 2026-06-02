import { format } from "date-fns";
import { isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { isManualApplication as hasManualSourceType } from "@/lib/applications/sourceType";
import { ApplicationStatus, JobApplication } from "@/types/application";

export type ApplicationModeFilter = "all" | "due" | "interviews" | "manual" | "coach_updates";

export const APPLICATION_STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: "in_progress", label: "En cours" },
  { value: "follow_up", label: "Relance à faire" },
  { value: "interview", label: "Entretien" },
  { value: "accepted", label: "Acceptée" },
  { value: "rejected", label: "Refusée" },
];

export const BULK_APPLICATION_STATUS_OPTIONS = APPLICATION_STATUS_OPTIONS.filter(
  (option) => option.value !== "interview"
);

export function getApplicationsDueSummary(applications: JobApplication[]) {
  const companyNames = applications
    .filter((entry) => isApplicationFollowUpDue(entry))
    .map((entry) => entry.job.company?.trim())
    .filter((company): company is string => Boolean(company));

  const uniqueCompanies = [...new Set(companyNames)];
  if (uniqueCompanies.length === 0) return "établissement non renseigné";

  const visibleCompanies = uniqueCompanies.slice(0, 3);
  const remainingCount = uniqueCompanies.length - visibleCompanies.length;

  if (remainingCount <= 0) return visibleCompanies.join(", ");
  return `${visibleCompanies.join(", ")} + ${remainingCount} autre${remainingCount > 1 ? "s" : ""}`;
}

export function countUpcomingInterviews(applications: JobApplication[], now: Date) {
  return applications.filter((entry) => {
    if (!entry.interviewAt) return false;
    const interviewDate = new Date(entry.interviewAt);
    return !Number.isNaN(interviewDate.getTime()) && !isAfter(now, interviewDate);
  }).length;
}

export function countClosedApplications(applications: JobApplication[]) {
  return applications.filter(
    (entry) => entry.status === "accepted" || entry.status === "rejected"
  ).length;
}

export function filterApplications(
  applications: JobApplication[],
  options: {
    search: string;
    modeFilter: ApplicationModeFilter;
    hasUnreadCoachUpdate: (application: JobApplication) => boolean;
  }
) {
  const normalizedSearch = options.search.trim().toLowerCase();

  return sortApplicationsByMostRecent(
    applications.filter((entry) => {
      if (options.modeFilter === "due" && !isApplicationFollowUpDue(entry)) return false;
      if (options.modeFilter === "interviews" && !entry.interviewAt) return false;
      if (options.modeFilter === "manual" && !isManualApplication(entry)) return false;
      if (options.modeFilter === "coach_updates" && !options.hasUnreadCoachUpdate(entry)) {
        return false;
      }
      if (!normalizedSearch) return true;

      return [
        entry.job.company || "",
        entry.job.title,
        entry.job.location,
        entry.job.contractType,
        entry.notes || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    })
  );
}

export function formatApplicationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "dd MMM yyyy", { locale: fr });
}

export function formatApplicationDateTime(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "dd MMM yyyy 'a' HH:mm", { locale: fr });
}

export function isFollowUpPending(status: ApplicationStatus) {
  return status === "in_progress" || status === "follow_up";
}

export function isFollowUpEnabled(application: Pick<JobApplication, "followUpEnabled">) {
  return application.followUpEnabled !== false;
}

export function isApplicationFollowUpDue(
  application: Pick<JobApplication, "status" | "followUpDueAt" | "followUpEnabled">,
  now: Date = new Date()
) {
  const due = new Date(application.followUpDueAt);
  return (
    isFollowUpPending(application.status) &&
    isFollowUpEnabled(application) &&
    !Number.isNaN(due.getTime()) &&
    !isAfter(due, now)
  );
}

export function getDisplayApplicationStatus(
  application: Pick<JobApplication, "status" | "followUpDueAt" | "followUpEnabled">,
  now: Date = new Date()
) {
  return isApplicationFollowUpDue(application, now) ? "follow_up" : application.status;
}

export function shouldShowFollowUpDetails(status: ApplicationStatus) {
  return status !== "rejected" && status !== "accepted" && status !== "interview";
}

export function isManualApplication(entry: JobApplication) {
  return hasManualSourceType(entry);
}

export function applicationStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case "accepted":
      return "Acceptée";
    case "rejected":
      return "Refusée";
    case "interview":
      return "Entretien";
    case "follow_up":
      return "Relance à faire";
    case "in_progress":
    default:
      return "En cours";
  }
}

function parseTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function getApplicationSortTime(entry: JobApplication) {
  const candidates = [entry.appliedAt, entry.updatedAt, entry.job.publicationDate];

  for (const value of candidates) {
    const time = parseTime(value);
    if (time !== null) {
      return time;
    }
  }

  return Number.NEGATIVE_INFINITY;
}

export function sortApplicationsByMostRecent(applications: JobApplication[]) {
  return [...applications].sort((left, right) => {
    const primaryDiff = getApplicationSortTime(right) - getApplicationSortTime(left);
    if (primaryDiff !== 0) return primaryDiff;

    const updatedDiff = (parseTime(right.updatedAt) ?? Number.NEGATIVE_INFINITY) - (parseTime(left.updatedAt) ?? Number.NEGATIVE_INFINITY);
    if (updatedDiff !== 0) return updatedDiff;

    return (parseTime(right.job.publicationDate) ?? Number.NEGATIVE_INFINITY) - (parseTime(left.job.publicationDate) ?? Number.NEGATIVE_INFINITY);
  });
}

export function getLatestSharedCoachNoteAt(application: JobApplication) {
  const timestamps = (application.sharedCoachNotes ?? [])
    .map((note) => note.updatedAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}
