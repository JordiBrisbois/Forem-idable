"use client";

import { canCoach, isAdmin } from "@/lib/authz";

import { useDeferredValue, useMemo } from "react";
import { CoachDashboardData } from "@/types/coach";
import { AuthUser } from "@/types/auth";
import {
  CoachGroupedUserGroup,
  CoachManagerPickerGroup,
  CoachMemberPickerGroup,
  CoachStageFilter,
  CoachUserFilter,
} from "@/features/coach/types";
import {
  buildCoachRecentActivity,
  buildGroupedUsers,
  buildManagerPickerGroup,
  buildMemberPickerGroup,
} from "@/features/coach/utils";

type UseCoachDashboardDerivedStateParams = {
  dashboard: CoachDashboardData | null;
  user: AuthUser | null;
  selectedUserId: number | null;
  memberPickerGroupId: number | null;
  coachPickerGroupId: number | null;
  managerPickerGroupId: number | null;
  importTargetUserId: number | null;
  search: string;
  userFilter: CoachUserFilter;
  stageFilter: CoachStageFilter;
};

export function useCoachDashboardDerivedState({
  dashboard,
  user,
  selectedUserId,
  memberPickerGroupId,
  coachPickerGroupId,
  managerPickerGroupId,
  importTargetUserId,
  search,
  userFilter,
  stageFilter,
}: UseCoachDashboardDerivedStateParams) {
  const deferredSearch = useDeferredValue(search);

  const selectedUser = useMemo(
    () => dashboard?.users.find((entry) => entry.id === selectedUserId) ?? null,
    [dashboard, selectedUserId]
  );

  const memberPickerGroup: CoachMemberPickerGroup | null = useMemo(
    () => buildMemberPickerGroup(dashboard?.groups, memberPickerGroupId),
    [dashboard?.groups, memberPickerGroupId]
  );
  const coachPickerGroup: CoachMemberPickerGroup | null = useMemo(
    () => buildMemberPickerGroup(dashboard?.groups, coachPickerGroupId),
    [dashboard?.groups, coachPickerGroupId]
  );
  const managerPickerGroup: CoachManagerPickerGroup | null = useMemo(
    () => buildManagerPickerGroup(dashboard?.groups, managerPickerGroupId),
    [dashboard?.groups, managerPickerGroupId]
  );

  const assignableUsers = useMemo(() => {
    if (!dashboard || !memberPickerGroup) return [];
    const memberIds = new Set(memberPickerGroup.members.map((entry) => entry.id));
    return dashboard.users.filter(
      (entry) => entry.role === "user" && !memberIds.has(entry.id)
    );
  }, [dashboard, memberPickerGroup]);

  const assignableCoaches = useMemo(() => {
    if (!dashboard || !coachPickerGroup) return [];

    const assignedCoachIds = new Set(coachPickerGroup.coaches.map((entry) => entry.id));
    return dashboard.availableCoaches.filter((entry) => !assignedCoachIds.has(entry.id));
  }, [coachPickerGroup, dashboard]);

  const assignableManagers = useMemo(
    () => managerPickerGroup?.coaches ?? [],
    [managerPickerGroup]
  );

  const groupedUsers: CoachGroupedUserGroup[] = useMemo(() => {
    if (!dashboard) return [];

    return buildGroupedUsers({
      groups: dashboard.groups,
      users: dashboard.users,
      normalizedSearch: deferredSearch.trim().toLowerCase(),
      userFilter,
      stageFilter,
    });
  }, [dashboard, deferredSearch, userFilter, stageFilter]);

  const recentActivity = useMemo(
    () => buildCoachRecentActivity(dashboard?.users ?? []),
    [dashboard?.users]
  );

  const importTargetUser = useMemo(
    () => dashboard?.users.find((entry) => entry.id === importTargetUserId) ?? null,
    [dashboard, importTargetUserId]
  );

  const canEditSelectedUser = useMemo(() => {
    if (!selectedUser || !user) return false;
    if (isAdmin(user.role)) return true;
    return selectedUser.role === "user";
  }, [selectedUser, user]);

  const canManageSelectedUserApiKeys = useMemo(
    () =>
      isAdmin(user?.role) &&
      Boolean(selectedUser) &&
      canCoach(selectedUser?.role),
    [selectedUser, user?.role]
  );

  const totalApplications =
    dashboard?.users.reduce((sum, entry) => sum + entry.applicationCount, 0) ?? 0;
  const totalInterviews =
    dashboard?.users.reduce((sum, entry) => sum + entry.interviewCount, 0) ?? 0;
  const totalDue = dashboard?.users.reduce((sum, entry) => sum + entry.dueCount, 0) ?? 0;
  const totalAccepted =
    dashboard?.users.reduce((sum, entry) => sum + entry.acceptedCount, 0) ?? 0;
  const totalRejected =
    dashboard?.users.reduce((sum, entry) => sum + entry.rejectedCount, 0) ?? 0;

  const stageCounts = useMemo<Record<CoachStageFilter, number>>(() => {
    const counts: Record<CoachStageFilter, number> = {
      all: 0,
      internship_search: 0,
      internship_ongoing: 0,
      job_search: 0,
      employed: 0,
      exited: 0,
    };
    dashboard?.users.forEach((user) => {
      if (canCoach(user.role)) return;
      counts.all++;
      counts[user.beneficiaryStage]++;
    });
    return counts;
  }, [dashboard?.users]);

  return {
    selectedUser,
    memberPickerGroup,
    coachPickerGroup,
    managerPickerGroup,
    assignableUsers,
    assignableCoaches,
    assignableManagers,
    groupedUsers,
    recentActivity,
    importTargetUser,
    canEditSelectedUser,
    canManageSelectedUserApiKeys,
    totalApplications,
    totalInterviews,
    totalDue,
    totalAccepted,
    totalRejected,
    stageCounts,
  };
}
