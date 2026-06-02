import {
  CoachGroupedUserGroup,
  CoachManagerPickerGroup,
  CoachMemberPickerGroup,
  CoachPhaseFilter,
  CoachUserFilter,
} from "@/features/coach/types";
import { CoachGroupSummary, CoachUserSummary } from "@/types/coach";
import { getCoachUserDisplayName, isCoachUserInactive } from "@/features/coach/utils/formatting";

export function buildMemberPickerGroup(
  groups: CoachGroupSummary[] | undefined,
  memberPickerGroupId: number | null
): CoachMemberPickerGroup | null {
  return groups?.find((group) => group.id === memberPickerGroupId) ?? null;
}

export function buildManagerPickerGroup(
  groups: CoachGroupSummary[] | undefined,
  groupId: number | null
): CoachManagerPickerGroup | null {
  const group = groups?.find((entry) => entry.id === groupId);
  if (!group) return null;

  return {
    id: group.id,
    name: group.name,
    coaches: group.coaches,
  };
}

function getMostRelevantActivityTime(user: CoachUserSummary) {
  const timestamps =
    user.role === "coach" || user.role === "admin"
      ? [user.lastCoachActionAt, user.lastSeenAt, user.latestActivityAt]
      : [user.latestActivityAt];

  for (const value of timestamps) {
    const time = value ? new Date(value).getTime() : 0;
    if (!Number.isNaN(time) && time > 0) {
      return time;
    }
  }

  return 0;
}

function matchesSearch(user: CoachUserSummary, normalizedSearch: string) {
  return (
    !normalizedSearch ||
    [user.firstName, user.lastName, `${user.firstName} ${user.lastName}`.trim(), user.email]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch)
  );
}

function matchesFilter(user: CoachUserSummary, userFilter: CoachUserFilter) {
  switch (userFilter) {
    case "urgent":
      return user.dueCount > 0 || user.interviewCount > 0 || isCoachUserInactive(user);
    case "due":
      return user.dueCount > 0;
    case "interviews":
      return user.interviewCount > 0;
    case "inactive":
      return isCoachUserInactive(user);
    case "accepted":
      return user.acceptedCount > 0;
    case "rejected":
      return user.rejectedCount > 0;
    case "all":
    default:
      return true;
  }
}

function matchesPhase(user: CoachUserSummary, phaseFilter: CoachPhaseFilter) {
  if (phaseFilter === "all") return true;
  return user.trackingPhase === phaseFilter;
}

function sortMembers(members: CoachUserSummary[]) {
  return [...members].sort((left, right) => {
    if (right.dueCount !== left.dueCount) return right.dueCount - left.dueCount;

    const leftLatest = getMostRelevantActivityTime(left);
    const rightLatest = getMostRelevantActivityTime(right);
    if (rightLatest !== leftLatest) return rightLatest - leftLatest;

    if (right.applicationCount !== left.applicationCount) {
      return right.applicationCount - left.applicationCount;
    }

    return getCoachUserDisplayName(left).localeCompare(getCoachUserDisplayName(right), "fr");
  });
}

export function buildGroupedUsers(input: {
  groups: CoachGroupSummary[];
  users: CoachUserSummary[];
  normalizedSearch: string;
  userFilter: CoachUserFilter;
  phaseFilter?: CoachPhaseFilter;
}): CoachGroupedUserGroup[] {
  const { groups, users, normalizedSearch, userFilter, phaseFilter = "all" } = input;

  const standardGroups = groups.map((group) => {
    const members = users.filter(
      (entry) =>
        entry.role !== "coach" &&
        group.members.some((member) => member.id === entry.id)
    );
    const visibleMembers = sortMembers(
      members.filter(
        (entry) =>
          matchesSearch(entry, normalizedSearch) &&
          matchesFilter(entry, userFilter) &&
          matchesPhase(entry, phaseFilter)
      )
    );

    return {
      id: group.id,
      name: group.name,
      createdById: group.createdBy.id,
      createdByLabel: getCoachUserDisplayName(group.createdBy),
      managerCoachId: group.managerCoachId,
      archivedAt: group.archivedAt,
      canAddMembers: true,
      canManageCoaches: true,
      kind: "standard" as const,
      totalApplications: visibleMembers.reduce((sum, entry) => sum + entry.applicationCount, 0),
      totalInterviews: visibleMembers.reduce((sum, entry) => sum + entry.interviewCount, 0),
      totalDue: visibleMembers.reduce((sum, entry) => sum + entry.dueCount, 0),
      totalAccepted: visibleMembers.reduce((sum, entry) => sum + entry.acceptedCount, 0),
      totalRejected: visibleMembers.reduce((sum, entry) => sum + entry.rejectedCount, 0),
      members: visibleMembers,
      coaches: group.coaches,
    };
  });

  const ungroupedMembers = users.filter(
    (entry) =>
      entry.role === "user" &&
      entry.groupIds.length === 0 &&
      matchesSearch(entry, normalizedSearch) &&
      matchesFilter(entry, userFilter) &&
      matchesPhase(entry, phaseFilter)
  );
  const allUngroupedMembers = users.filter(
    (entry) => entry.role === "user" && entry.groupIds.length === 0
  );

  const syntheticGroups: CoachGroupedUserGroup[] = [
    {
      id: -1,
      name: "Aucun groupe attribué",
      createdById: null,
      createdByLabel: null,
      managerCoachId: null,
      archivedAt: null,
      canAddMembers: false,
      canManageCoaches: false,
      kind: "ungrouped",
      totalApplications: allUngroupedMembers.reduce((sum, entry) => sum + entry.applicationCount, 0),
      totalInterviews: allUngroupedMembers.reduce((sum, entry) => sum + entry.interviewCount, 0),
      totalDue: allUngroupedMembers.reduce((sum, entry) => sum + entry.dueCount, 0),
      totalAccepted: allUngroupedMembers.reduce((sum, entry) => sum + entry.acceptedCount, 0),
      totalRejected: allUngroupedMembers.reduce((sum, entry) => sum + entry.rejectedCount, 0),
      members: sortMembers(ungroupedMembers),
      coaches: [],
    },
  ];

  return [...standardGroups, ...syntheticGroups].filter(
    (group) => group.members.length > 0 || (!normalizedSearch && userFilter === "all" && phaseFilter === "all")
  );
}
