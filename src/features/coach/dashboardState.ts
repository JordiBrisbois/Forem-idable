import { buildCoachApplicationSummary, sortApplicationsByAppliedAtDesc } from "@/features/coach/applicationSummary";
import { JobApplication } from "@/types/application";
import { UserRole } from "@/types/auth";
import { CoachDashboardData, CoachUserSummary } from "@/types/coach";

function sortGroupParticipantsByEmail<T extends { email: string }>(entries: T[]) {
  return [...entries].sort((left, right) => left.email.localeCompare(right.email, "fr"));
}

function toGroupParticipant(
  input: Pick<CoachUserSummary, "id" | "email" | "firstName" | "lastName" | "role" | "lastSeenAt">
) {
  return {
    id: input.id,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    lastSeenAt: input.lastSeenAt,
  };
}

export function summarizeUserApplications(
  entry: CoachUserSummary,
  nextApplications: JobApplication[]
): CoachUserSummary {
  return {
    ...entry,
    applications: nextApplications,
    ...buildCoachApplicationSummary(nextApplications),
  };
}

export function applyApplicationUpdateToDashboard(
  dashboard: CoachDashboardData,
  userId: number,
  application: JobApplication
): CoachDashboardData {
  return {
    ...dashboard,
    users: dashboard.users.map((entry) => {
      if (entry.id !== userId) {
        return entry;
      }

      const nextApplications = sortApplicationsByAppliedAtDesc(
        entry.applications.map((existing) =>
          existing.job.id === application.job.id ? application : existing
        )
      );

      return summarizeUserApplications(entry, nextApplications);
    }),
  };
}

export function removeApplicationFromDashboard(
  dashboard: CoachDashboardData,
  userId: number,
  jobId: string
): CoachDashboardData {
  return {
    ...dashboard,
    users: dashboard.users.map((entry) => {
      if (entry.id !== userId) {
        return entry;
      }

      return summarizeUserApplications(
        entry,
        entry.applications.filter((application) => application.job.id !== jobId)
      );
    }),
  };
}

export function removeMembershipFromDashboard(
  dashboard: CoachDashboardData,
  groupId: number,
  userId: number
): CoachDashboardData {
  const targetGroup = dashboard.groups.find((group) => group.id === groupId);
  const nextGroups = dashboard.groups.map((group) =>
    group.id === groupId
      ? {
          ...group,
          members: group.members.filter((member) => member.id !== userId),
        }
      : group
  );

  const nextUsers = dashboard.users.map((entry) => {
    if (entry.id !== userId) {
      return entry;
    }

    return {
      ...entry,
      groupIds: entry.groupIds.filter((id) => id !== groupId),
      groupNames:
        targetGroup && entry.groupNames.includes(targetGroup.name)
          ? entry.groupNames.filter((name) => name !== targetGroup.name)
          : entry.groupNames,
    };
  });

  return {
    ...dashboard,
    groups: nextGroups,
    users: nextUsers,
  };
}

export function addMembershipToDashboard(
  dashboard: CoachDashboardData,
  groupId: number,
  userId: number
): CoachDashboardData {
  const targetGroup = dashboard.groups.find((group) => group.id === groupId);
  const targetUser = dashboard.users.find((entry) => entry.id === userId);
  if (!targetGroup || !targetUser) {
    return dashboard;
  }

  const nextGroups = dashboard.groups.map((group) =>
    group.id === groupId && !group.members.some((member) => member.id === userId)
      ? {
          ...group,
          members: sortGroupParticipantsByEmail([
            ...group.members,
            toGroupParticipant(targetUser),
          ]),
        }
      : group
  );

  const nextUsers = dashboard.users.map((entry) => {
    if (entry.id !== userId) {
      return entry;
    }

    return {
      ...entry,
      groupIds: entry.groupIds.includes(groupId) ? entry.groupIds : [...entry.groupIds, groupId],
      groupNames: entry.groupNames.includes(targetGroup.name)
        ? entry.groupNames
        : [...entry.groupNames, targetGroup.name],
    };
  });

  return {
    ...dashboard,
    groups: nextGroups,
    users: nextUsers,
  };
}

export function addCoachAssignmentToDashboard(
  dashboard: CoachDashboardData,
  groupId: number,
  coachId: number
): CoachDashboardData {
  const targetCoach =
    dashboard.availableCoaches.find((entry) => entry.id === coachId) ??
    dashboard.users.find((entry) => entry.id === coachId && entry.role === "coach");

  if (!targetCoach) {
    return dashboard;
  }

  return {
    ...dashboard,
    groups: dashboard.groups.map((group) =>
      group.id === groupId && !group.coaches.some((entry) => entry.id === coachId)
        ? {
            ...group,
            coaches: sortGroupParticipantsByEmail([
              ...group.coaches,
              toGroupParticipant(targetCoach),
            ]),
          }
        : group
    ),
  };
}

export function removeCoachAssignmentFromDashboard(
  dashboard: CoachDashboardData,
  groupId: number,
  coachId: number
): CoachDashboardData {
  return {
    ...dashboard,
    groups: dashboard.groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            managerCoachId: group.managerCoachId === coachId ? null : group.managerCoachId,
            coaches: group.coaches.filter((entry) => entry.id !== coachId),
          }
        : group
    ),
  };
}

export function setGroupManagerInDashboard(
  dashboard: CoachDashboardData,
  groupId: number,
  coachId: number
): CoachDashboardData {
  return {
    ...dashboard,
    groups: dashboard.groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            managerCoachId: coachId,
          }
        : group
    ),
  };
}

export function updateUserPhaseInDashboard(
  dashboard: CoachDashboardData,
  userId: number,
  phase: CoachUserSummary["trackingPhase"]
): CoachDashboardData {
  return {
    ...dashboard,
    users: dashboard.users.map((entry) =>
      entry.id === userId ? { ...entry, trackingPhase: phase } : entry
    ),
    groups: dashboard.groups.map((group) => ({
      ...group,
      members: group.members.map((entry) =>
        entry.id === userId ? { ...entry, trackingPhase: phase } : entry
      ),
    })),
  };
}

export function updateManagedUserInDashboard(
  dashboard: CoachDashboardData,
  userId: number,
  patch: Pick<CoachUserSummary, "firstName" | "lastName">
): CoachDashboardData {
  return {
    ...dashboard,
    users: dashboard.users.map((entry) =>
      entry.id === userId
        ? {
            ...entry,
            firstName: patch.firstName,
            lastName: patch.lastName,
          }
        : entry
    ),
    groups: dashboard.groups.map((group) => ({
      ...group,
      members: group.members.map((entry) =>
        entry.id === userId
          ? {
              ...entry,
              firstName: patch.firstName,
              lastName: patch.lastName,
            }
          : entry
      ),
      coaches: group.coaches.map((entry) =>
        entry.id === userId
          ? {
              ...entry,
              firstName: patch.firstName,
              lastName: patch.lastName,
            }
          : entry
      ),
    })),
    availableCoaches: dashboard.availableCoaches.map((entry) =>
      entry.id === userId
        ? {
            ...entry,
            firstName: patch.firstName,
            lastName: patch.lastName,
          }
        : entry
    ),
  };
}

export function insertGroupIntoDashboard(
  dashboard: CoachDashboardData,
  input: {
    id: number;
    name: string;
    createdAt: string;
    createdBy: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
    };
    managerCoachId: number | null;
    initialCoach?: Pick<
      CoachUserSummary,
      "id" | "email" | "firstName" | "lastName" | "role" | "lastSeenAt"
    > | null;
  }
): CoachDashboardData {
  return {
    ...dashboard,
    groups: [
      {
        id: input.id,
        name: input.name,
        createdAt: input.createdAt,
        archivedAt: null,
        createdBy: input.createdBy,
        managerCoachId: input.managerCoachId,
        members: [],
        coaches: input.initialCoach ? [toGroupParticipant(input.initialCoach)] : [],
      },
      ...dashboard.groups,
    ].sort((left, right) => left.name.localeCompare(right.name, "fr")),
  };
}

export function replaceGroupIdInDashboard(
  dashboard: CoachDashboardData,
  currentGroupId: number,
  nextGroupId: number
): CoachDashboardData {
  return {
    ...dashboard,
    groups: dashboard.groups.map((group) =>
      group.id === currentGroupId
        ? {
            ...group,
            id: nextGroupId,
          }
        : group
    ),
    users: dashboard.users.map((entry) => ({
      ...entry,
      groupIds: entry.groupIds.map((groupId) => (groupId === currentGroupId ? nextGroupId : groupId)),
    })),
  };
}

export function removeGroupFromDashboard(
  dashboard: CoachDashboardData,
  groupId: number
): CoachDashboardData {
  const targetGroup = dashboard.groups.find((group) => group.id === groupId);
  if (!targetGroup) {
    return dashboard;
  }

  return {
    ...dashboard,
    groups: dashboard.groups.filter((group) => group.id !== groupId),
    users: dashboard.users.map((entry) =>
      entry.groupIds.includes(groupId)
        ? {
            ...entry,
            groupIds: entry.groupIds.filter((id) => id !== groupId),
            groupNames: entry.groupNames.filter((name) => name !== targetGroup.name),
          }
        : entry
    ),
  };
}

export function updateUserRoleInDashboard(
  dashboard: CoachDashboardData,
  userId: number,
  nextRole: UserRole
): CoachDashboardData {
  const updatedUser = dashboard.users.find((entry) => entry.id === userId);

  return {
    ...dashboard,
    users: dashboard.users.map((entry) =>
      entry.id === userId
        ? {
            ...entry,
            role: nextRole,
        }
        : entry
    ),
    groups: dashboard.groups.map((group) => ({
      ...group,
      members: group.members.map((entry) =>
        entry.id === userId
          ? {
              ...entry,
              role: nextRole,
            }
          : entry
      ),
      coaches:
        nextRole === "coach"
          ? group.coaches.map((entry) =>
              entry.id === userId
                ? {
                    ...entry,
                    role: nextRole,
                  }
                : entry
            )
          : group.coaches.filter((entry) => entry.id !== userId),
    })),
    availableCoaches:
      nextRole === "coach"
        ? updatedUser && !dashboard.availableCoaches.some((entry) => entry.id === userId)
          ? [
              ...dashboard.availableCoaches,
              {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                role: "coach" as UserRole,
                lastSeenAt: updatedUser.lastSeenAt,
              },
            ].sort((left, right) => left.email.localeCompare(right.email, "fr"))
          : dashboard.availableCoaches.map((entry) =>
              entry.id === userId
                ? {
                    ...entry,
                    role: "coach" as UserRole,
                  }
                : entry
            )
        : dashboard.availableCoaches.filter((entry) => entry.id !== userId),
  };
}
