"use client";

import { useDeferredValue, useMemo } from "react";
import { CoachDashboardData } from "@/types/coach";
import { AuthUser } from "@/types/auth";
import {
  CoachGroupedUserGroup,
  CoachManagerPickerGroup,
  CoachMemberPickerGroup,
  CoachPhaseFilter,
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
  phaseFilter: CoachPhaseFilter;
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
  phaseFilter,
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
    return dashboard.users.filter((entry) => !memberIds.has(entry.id));
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
      phaseFilter,
    });
  }, [dashboard, deferredSearch, userFilter, phaseFilter]);

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
    if (user.role === "admin") return true;
    return selectedUser.role === "user";
  }, [selectedUser, user]);

  const canManageSelectedUserApiKeys = useMemo(
    () =>
      user?.role === "admin" &&
      Boolean(selectedUser) &&
      (selectedUser?.role === "coach" || selectedUser?.role === "admin"),
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

  const phaseCounts = useMemo(() => {
    const counts = {
      all: 0,
      internship_search: 0,
      job_search: 0,
      placed: 0,
      dropped: 0,
    };
    dashboard?.users.forEach((user) => {
      if (user.role === "coach") return;
      counts.all++;
      if (user.trackingPhase in counts) {
        counts[user.trackingPhase as keyof typeof counts]++;
      }
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
    phaseCounts,
  };
}
