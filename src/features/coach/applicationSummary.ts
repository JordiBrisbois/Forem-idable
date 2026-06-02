import { isAfter } from "date-fns";
import { normalizeContractType } from "@/lib/contractType";
import { JobApplication } from "@/types/application";

export interface CoachApplicationSummary {
  applicationCount: number;
  interviewCount: number;
  dueCount: number;
  acceptedCount: number;
  rejectedCount: number;
  inProgressCount: number;
  latestActivityAt: string | null;
  hasAcceptedStage: boolean;
  hasAcceptedJob: boolean;
}

export function getLatestApplicationActivity(applications: JobApplication[]) {
  return (
    applications
      .map((item) => item.updatedAt)
      .filter(Boolean)
      .sort((a, b) => (a > b ? -1 : 1))[0] ?? null
  );
}

export function sortApplicationsByAppliedAtDesc(applications: JobApplication[]) {
  return [...applications].sort((left, right) => {
    const leftTime = new Date(left.appliedAt).getTime();
    const rightTime = new Date(right.appliedAt).getTime();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  });
}

export function buildCoachApplicationSummary(
  applications: JobApplication[],
  now = new Date()
): CoachApplicationSummary {
  let hasAcceptedStage = false;
  let hasAcceptedJob = false;

  for (const app of applications) {
    if (app.status === "accepted") {
      if (normalizeContractType(app.job.contractType) === "STAGE") {
        hasAcceptedStage = true;
      } else {
        hasAcceptedJob = true;
      }
    }
  }

  return {
    applicationCount: applications.length,
    interviewCount: applications.filter((item) => item.status === "interview").length,
    dueCount: applications.filter((item) => {
      const due = new Date(item.followUpDueAt);
      return (
        (item.status === "in_progress" || item.status === "follow_up") &&
        item.followUpEnabled !== false &&
        !Number.isNaN(due.getTime()) &&
        !isAfter(due, now)
      );
    }).length,
    acceptedCount: applications.filter((item) => item.status === "accepted").length,
    rejectedCount: applications.filter((item) => item.status === "rejected").length,
    inProgressCount: applications.filter((item) => item.status === "in_progress").length,
    latestActivityAt: getLatestApplicationActivity(applications),
    hasAcceptedStage,
    hasAcceptedJob,
  };
}
