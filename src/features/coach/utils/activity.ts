import {
  addDays,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import { CoachUserSummary } from "@/types/coach";
import {
  formatCoachDate,
  getCoachUserDisplayName,
  isApplicationDue,
  isTrackedCoachBeneficiary,
  parseTimestamp,
} from "@/features/coach/utils/formatting";
import { getComputedPhaseBadge } from "@/features/coach/utils/phaseBadge";

export interface CoachRecentActivityItem {
  id: string;
  userId: number;
  jobId: string | null;
  kind: "application" | "interview";
  userName: string;
  groupLabel: string;
  title: string;
  detail: string;
  timestamp: string;
}

export function buildCoachRecentActivity(
  users: CoachUserSummary[],
  maxItems = 10
): CoachRecentActivityItem[] {
  const items: CoachRecentActivityItem[] = [];

  for (const user of users) {
    if (!isTrackedCoachBeneficiary(user)) {
      continue;
    }

    const groupLabel = user.groupNames[0] ?? "Aucun groupe";
    const userName = getCoachUserDisplayName(user);

    for (const application of user.applications) {
      if (parseTimestamp(application.updatedAt) !== null) {
        items.push({
          id: `application-${user.id}-${application.job.id}`,
          userId: user.id,
          jobId: application.job.id,
          kind: "application",
          userName,
          groupLabel,
          title: application.job.title,
          detail: `${application.job.company || "Entreprise non précisée"} • candidature mise à jour`,
          timestamp: application.updatedAt,
        });
      }

      if (
        application.interviewAt &&
        parseTimestamp(application.interviewAt) !== null &&
        application.updatedAt &&
        parseTimestamp(application.updatedAt) !== null
      ) {
        items.push({
          id: `interview-${user.id}-${application.job.id}`,
          userId: user.id,
          jobId: application.job.id,
          kind: "interview",
          userName,
          groupLabel,
          title: application.job.title,
          detail: `${application.job.company || "Entreprise non précisée"} • entretien planifié`,
          timestamp: application.interviewAt,
        });
      }
    }
  }

  return items
    .sort((left, right) => {
      const leftTime = parseTimestamp(left.timestamp) ?? 0;
      const rightTime = parseTimestamp(right.timestamp) ?? 0;
      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      return left.userName.localeCompare(right.userName, "fr");
    })
    .slice(0, maxItems);
}

export interface CoachPriorityItem {
  id: string;
  userId: number;
  jobId: string | null;
  userName: string;
  userEmail: string;
  groupLabel: string;
  badgeLabel: string;
  badgeTitle?: string;
  summary: string;
  detail: string;
  timestamp: string | null;
  computedPhaseLabel: string;
  computedPhaseVariant: "default" | "secondary" | "success" | "outline" | "destructive" | "error" | "info" | "warning";
}

function computePhaseBadge(user: CoachUserSummary) {
  return getComputedPhaseBadge(user.trackingPhase, user.hasAcceptedStage, user.hasAcceptedJob);
}

export interface CoachPrioritySection {
  id: "due" | "interviews" | "inactive";
  title: string;
  description: string;
  emptyLabel: string;
  total: number;
  items: CoachPriorityItem[];
}

function comparePriorityItemsByTimestamp(left: CoachPriorityItem, right: CoachPriorityItem) {
  const leftTime = parseTimestamp(left.timestamp);
  const rightTime = parseTimestamp(right.timestamp);

  if (leftTime === null && rightTime === null) return left.userName.localeCompare(right.userName, "fr");
  if (leftTime === null) return 1;
  if (rightTime === null) return -1;
  if (leftTime !== rightTime) return leftTime - rightTime;

  return left.userName.localeCompare(right.userName, "fr");
}

export function buildCoachPrioritySections(
  users: CoachUserSummary[],
  now = new Date()
): CoachPrioritySection[] {
  const startToday = startOfDay(now);
  const interviewWindowEnd = addDays(startToday, 7);

  const beneficiaryUsers = users.filter((entry) => isTrackedCoachBeneficiary(entry));

  const dueItems = beneficiaryUsers
    .filter((user) => !user.hasAcceptedStage)
    .map<CoachPriorityItem | null>((user) => {
      const dueApplications = user.applications.filter((application) => isApplicationDue(application));
      if (dueApplications.length === 0) {
        return null;
      }

      const oldestDue = dueApplications
        .map((application) => ({
          application,
          time: parseTimestamp(application.followUpDueAt),
        }))
        .filter((entry): entry is { application: typeof dueApplications[number]; time: number } => entry.time !== null)
        .sort((left, right) => left.time - right.time)[0];
      const oldestDueApplication = oldestDue?.application;
      const oldestDueTime = oldestDue?.time;
      const oldestDueCompany = oldestDueApplication?.job.company || "Entreprise non précisée";
      const dueBadgeLabel =
        dueApplications.length > 1 ? `${oldestDueCompany} + ${dueApplications.length - 1}` : oldestDueCompany;
      const phaseBadge = computePhaseBadge(user);

      return {
        id: `due-${user.id}`,
        userId: user.id,
        jobId: oldestDueApplication?.job.id ?? null,
        userName: getCoachUserDisplayName(user),
        userEmail: user.email,
        groupLabel: user.groupNames[0] ?? "Aucun groupe",
        badgeLabel: dueBadgeLabel,
        badgeTitle:
          dueApplications.length > 1
            ? dueApplications
                .map((application) => application.job.company || "Entreprise non précisée")
                .join(", ")
            : oldestDueCompany,
        summary: `${dueApplications.length} relance${dueApplications.length > 1 ? "s" : ""} due${dueApplications.length > 1 ? "s" : ""}`,
        detail:
          oldestDueTime !== undefined
            ? `Plus ancienne le ${formatCoachDate(new Date(oldestDueTime).toISOString())}`
            : "Relance due à vérifier",
        timestamp: oldestDueTime ? new Date(oldestDueTime).toISOString() : null,
        computedPhaseLabel: phaseBadge.label,
        computedPhaseVariant: phaseBadge.variant,
      } satisfies CoachPriorityItem;
    })
    .filter((item): item is CoachPriorityItem => item !== null)
    .sort(comparePriorityItemsByTimestamp);

  const interviewItems = beneficiaryUsers
    .map<CoachPriorityItem | null>((user) => {
      const upcomingInterviews = user.applications.filter((application) => {
        if (!application.interviewAt) {
          return false;
        }

        const interviewDate = new Date(application.interviewAt);
        return (
          !Number.isNaN(interviewDate.getTime()) &&
          !isBefore(interviewDate, startToday) &&
          !isAfter(interviewDate, interviewWindowEnd)
        );
      });

      if (upcomingInterviews.length === 0) {
        return null;
      }

      const earliestInterview = upcomingInterviews
        .map((application) => ({
          application,
          time: parseTimestamp(application.interviewAt),
        }))
        .filter((entry): entry is { application: typeof upcomingInterviews[number]; time: number } => entry.time !== null)
        .sort((left, right) => left.time - right.time)[0];
      const earliestInterviewApplication = earliestInterview?.application;
      const earliestInterviewTime = earliestInterview?.time;
      const earliestInterviewCompany =
        earliestInterviewApplication?.job.company || "Entreprise non précisée";
      const interviewBadgeLabel =
        upcomingInterviews.length > 1
          ? `${earliestInterviewCompany} + ${upcomingInterviews.length - 1}`
          : earliestInterviewCompany;
      const phaseBadge = computePhaseBadge(user);

      return {
        id: `interview-${user.id}`,
        userId: user.id,
        jobId: earliestInterviewApplication?.job.id ?? null,
        userName: getCoachUserDisplayName(user),
        userEmail: user.email,
        groupLabel: user.groupNames[0] ?? "Aucun groupe",
        badgeLabel: interviewBadgeLabel,
        badgeTitle:
          upcomingInterviews.length > 1
            ? upcomingInterviews
                .map((application) => application.job.company || "Entreprise non précisée")
                .join(", ")
            : earliestInterviewCompany,
        summary: `${upcomingInterviews.length} entretien${upcomingInterviews.length > 1 ? "s" : ""} à venir`,
        detail:
          earliestInterviewTime !== undefined
            ? `Prochain le ${formatCoachDate(new Date(earliestInterviewTime).toISOString(), true)}`
            : "Entretien programmé à vérifier",
        timestamp: earliestInterviewTime ? new Date(earliestInterviewTime).toISOString() : null,
        computedPhaseLabel: phaseBadge.label,
        computedPhaseVariant: phaseBadge.variant,
      } satisfies CoachPriorityItem;
    })
    .filter((item): item is CoachPriorityItem => item !== null)
    .sort(comparePriorityItemsByTimestamp);

  const inactiveItems = beneficiaryUsers
    .filter((user) => {
      if (user.applicationCount === 0) return false;
      if (user.acceptedCount > 0) return false;
      const activeCount = user.inProgressCount + user.dueCount + user.interviewCount;
      if (activeCount === 0) return false;
      return true;
    })
    .map<CoachPriorityItem | null>((user) => {
      const latestActivityTime = parseTimestamp(user.latestActivityAt);
      if (latestActivityTime !== null && differenceInCalendarDays(now, new Date(latestActivityTime)) < 14) {
        return null;
      }

      const phaseBadge = computePhaseBadge(user);

      return {
        id: `inactive-${user.id}`,
        userId: user.id,
        jobId: null,
        userName: getCoachUserDisplayName(user),
        userEmail: user.email,
        groupLabel: user.groupNames[0] ?? "Aucun groupe",
        badgeLabel: user.groupNames[0] ?? "Aucun groupe",
        badgeTitle: user.groupNames[0] ?? "Aucun groupe",
        summary: latestActivityTime
          ? `Inactif depuis ${differenceInCalendarDays(now, new Date(latestActivityTime))} jours`
          : "Aucune activité enregistrée",
        detail: `${user.applicationCount} candidature${user.applicationCount > 1 ? "s" : ""} à suivre`,
        timestamp: latestActivityTime ? new Date(latestActivityTime).toISOString() : null,
        computedPhaseLabel: phaseBadge.label,
        computedPhaseVariant: phaseBadge.variant,
      } satisfies CoachPriorityItem;
    })
    .filter((item): item is CoachPriorityItem => item !== null)
    .sort((left, right) => {
      const leftTime = parseTimestamp(left.timestamp);
      const rightTime = parseTimestamp(right.timestamp);

      if (leftTime === null && rightTime === null) return left.userName.localeCompare(right.userName, "fr");
      if (leftTime === null) return -1;
      if (rightTime === null) return 1;
      if (leftTime !== rightTime) return leftTime - rightTime;

      return left.userName.localeCompare(right.userName, "fr");
    });

  return [
    {
      id: "due",
      title: "Relances à traiter",
      description: "Bénéficiaires avec au moins une relance échue ou en retard.",
      emptyLabel: "Aucune relance urgente.",
      total: dueItems.length,
      items: dueItems,
    },
    {
      id: "interviews",
      title: "Entretiens proches",
      description: "Entretiens programmés aujourd'hui ou dans les 7 prochains jours.",
      emptyLabel: "Aucun entretien proche.",
      total: interviewItems.length,
      items: interviewItems,
    },
    {
      id: "inactive",
      title: "Suivis à relancer",
      description: "Bénéficiaires sans activité récente depuis au moins 14 jours.",
      emptyLabel: "Aucun suivi inactif notable.",
      total: inactiveItems.length,
      items: inactiveItems,
    },
  ];
}
