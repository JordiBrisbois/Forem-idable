"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchCoachDashboard,
} from "@/features/coach/coachDashboardApi";
import {
  addMembershipToDashboard,
  addCoachAssignmentToDashboard,
  applyApplicationUpdateToDashboard,
  insertGroupIntoDashboard,
  removeApplicationFromDashboard,
  removeCoachAssignmentFromDashboard,
  removeGroupFromDashboard,
  removeMembershipFromDashboard,
  replaceGroupIdInDashboard,
  setGroupManagerInDashboard,
  updateManagedUserInDashboard,
  updateUserPhaseInDashboard,
} from "@/features/coach/dashboardState";
import { ApiKeySummary } from "@/types/externalApi";
import { JobApplication } from "@/types/application";
import { CoachDashboardData, CoachUserSummary } from "@/types/coach";
import {
  CoachApiKeysTarget,
  CoachCalendarRegenerationTarget,
  CoachDeleteUserTarget,
  CoachUndoAction,
  CoachRemoveCoachTarget,
  CoachUserFilter,
  CoachRevokeApiKeyTarget,
  CoachRemoveGroupTarget,
  CoachRemoveMembershipTarget,
} from "@/features/coach/types";
import { useCoachDashboardDerivedState } from "@/features/coach/useCoachDashboardDerivedState";
import { useCoachApplicationActions } from "@/features/coach/useCoachApplicationActions";
import { useCoachAdminActions } from "@/features/coach/useCoachAdminActions";
import { useCoachGroupActions } from "@/features/coach/useCoachGroupActions";
import { useCoachUtilities } from "@/features/coach/useCoachUtilities";
import { useCoachPhaseTabs } from "@/features/coach/useCoachPhaseTabs";

export function useCoachDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [dashboard, setDashboard] = useState<CoachDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<CoachUndoAction | null>(null);
  const [groupName, setGroupName] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [memberPickerGroupId, setMemberPickerGroupId] = useState<number | null>(null);
  const [coachPickerGroupId, setCoachPickerGroupId] = useState<number | null>(null);
  const [managerPickerGroupId, setManagerPickerGroupId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [removeMembership, setRemoveMembership] = useState<CoachRemoveMembershipTarget | null>(null);
  const [removeCoach, setRemoveCoach] = useState<CoachRemoveCoachTarget | null>(null);
  const [removeGroup, setRemoveGroup] = useState<CoachRemoveGroupTarget | null>(null);
  const [apiKeysTarget, setApiKeysTarget] = useState<CoachApiKeysTarget | null>(null);
  const [importTargetUserId, setImportTargetUserId] = useState<number | null>(null);
  const [managedApiKeys, setManagedApiKeys] = useState<ApiKeySummary[]>([]);
  const [apiKeysFeedback, setApiKeysFeedback] = useState<string | null>(null);
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(false);
  const [revokeApiKeyTarget, setRevokeApiKeyTarget] = useState<CoachRevokeApiKeyTarget | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<CoachDeleteUserTarget | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [calendarRegenerationTarget, setCalendarRegenerationTarget] =
    useState<CoachCalendarRegenerationTarget | null>(null);
  const [phaseDialogUser, setPhaseDialogUser] = useState<CoachUserSummary | null>(null);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<CoachUserFilter>("all");
  const { phaseFilter, setPhaseFilter } = useCoachPhaseTabs();
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const applyApplicationUpdate = (userId: number, application: JobApplication) => {
    setDashboard((current) => {
      if (!current) return current;
      return applyApplicationUpdateToDashboard(current, userId, application);
    });
  };

  const removeApplicationLocally = (userId: number, jobId: string) => {
    setDashboard((current) => {
      if (!current) return current;
      return removeApplicationFromDashboard(current, userId, jobId);
    });
  };

  const removeMembershipLocally = (groupId: number, userId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return removeMembershipFromDashboard(current, groupId, userId);
    });
  };

  const addMembershipLocally = (groupId: number, userId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return addMembershipToDashboard(current, groupId, userId);
    });
  };

  const addCoachLocally = (groupId: number, coachId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return addCoachAssignmentToDashboard(current, groupId, coachId);
    });
  };

  const removeCoachLocally = (groupId: number, coachId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return removeCoachAssignmentFromDashboard(current, groupId, coachId);
    });
  };

  const setGroupManagerLocally = (groupId: number, coachId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return setGroupManagerInDashboard(current, groupId, coachId);
    });
  };

  const updateManagedUserLocally = (
    userId: number,
    patch: Pick<CoachUserSummary, "firstName" | "lastName">
  ) => {
    setDashboard((current) => {
      if (!current) return current;
      return updateManagedUserInDashboard(current, userId, patch);
    });
  };

  const updateUserPhase = useCallback(
    async (userId: number, phase: string, reason?: string) => {
      const previousPhase = dashboard?.users.find((u) => u.id === userId)?.trackingPhase;

      setDashboard((current) => {
        if (!current) return current;
        return updateUserPhaseInDashboard(current, userId, phase as CoachUserSummary["trackingPhase"]);
      });

      const response = await fetch(`/api/coach/users/${userId}/phase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase, reason }),
      });

      if (!response.ok) {
        setDashboard((current) => {
          if (!current || !previousPhase) return current;
          return updateUserPhaseInDashboard(current, userId, previousPhase);
        });
        toast.error("Changement de phase impossible.");
        return;
      }

      toast.success("Phase mise à jour.");
    },
    [dashboard, setDashboard]
  );

  const addGroupLocally = (input: {
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
  }) => {
    setDashboard((current) => {
      if (!current) return current;
      return insertGroupIntoDashboard(current, input);
    });
  };

  const replaceGroupIdLocally = (currentGroupId: number, nextGroupId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return replaceGroupIdInDashboard(current, currentGroupId, nextGroupId);
    });
  };

  const removeGroupLocally = (groupId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return removeGroupFromDashboard(current, groupId);
    });
  };

  const loadDashboard = async (options?: { preserveFeedback?: boolean }) => {
    setIsLoading(true);
    if (!options?.preserveFeedback) {
      setFeedback(null);
    }

    try {
      const { response, data } = await fetchCoachDashboard();

      if (!response.ok || !data.dashboard) {
        setDashboard(null);
        setFeedback(data.error || "Accès coach indisponible.");
        return;
      }

      setDashboard(data.dashboard);
    } catch {
      setDashboard(null);
      setFeedback("Accès coach indisponible.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user || (user.role !== "coach" && user.role !== "admin")) {
      setIsLoading(false);
      return;
    }

    void loadDashboard();
  }, [isAuthLoading, user]);

  const coachApplicationActions = useCoachApplicationActions({
    applyApplicationUpdate,
    loadDashboard,
    removeApplicationLocally,
    setFeedback,
    onImportComplete: () => {
      setImportTargetUserId(null);
    },
  });

  const coachGroupActions = useCoachGroupActions({
    user,
    dashboard,
    groupName,
    addCoachLocally,
    addGroupLocally,
    addMembershipLocally,
    loadDashboard,
    removeCoachLocally,
    removeGroupLocally,
    removeMembershipLocally,
    replaceGroupIdLocally,
    setCoachPickerGroupId,
    setDashboard,
    setFeedback,
    setGroupManagerLocally,
    setGroupName,
    setIsCreateGroupOpen,
    setManagerPickerGroupId,
    setMemberPickerGroupId,
    setUndoAction,
    setIsDeletingGroup,
  });

  const {
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
  } = useCoachDashboardDerivedState({
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
  });

  const coachAdminActions = useCoachAdminActions({
    user,
    selectedUser,
    selectedUserId,
    apiKeysTarget,
    revokeApiKeyTarget,
    deleteUserTarget,
    loadDashboard,
    setApiKeysFeedback,
    setApiKeysTarget,
    setDeleteUserTarget,
    setFeedback,
    setIsApiKeysLoading,
    setIsDeletingUser,
    setManagedApiKeys,
    setRevokeApiKeyTarget,
    setSelectedUserId,
    setUndoAction,
    updateManagedUserLocally,
  });

  const coachUtilities = useCoachUtilities({
    calendarRegenerationTarget,
    selectedUser,
    setCalendarRegenerationTarget,
    setFeedback,
  });

  const undoLastAction = async () => {
    if (!undoAction) return;

    if (undoAction.type === "remove-membership") {
      await coachGroupActions.restoreMembership(undoAction);
    }
  };

  return {
    user,
    isAuthLoading,
    dashboard,
    isLoading,
    feedback,
    setFeedback,
    undoAction,
    groupName,
    setGroupName,
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    memberPickerGroupId,
    setMemberPickerGroupId,
    coachPickerGroupId,
    setCoachPickerGroupId,
    managerPickerGroupId,
    setManagerPickerGroupId,
    selectedUserId,
    setSelectedUserId,
    removeMembership,
    setRemoveMembership,
    removeCoach,
    setRemoveCoach,
    removeGroup,
    setRemoveGroup,
    apiKeysTarget,
    setApiKeysTarget,
    importTargetUser,
    importTargetUserId,
    setImportTargetUserId,
    managedApiKeys,
    apiKeysFeedback,
    isApiKeysLoading,
    isImportingApplications: coachApplicationActions.isImportingApplications,
    revokeApiKeyTarget,
    setRevokeApiKeyTarget,
    deleteUserTarget,
    isDeletingUser,
    setDeleteUserTarget,
    calendarRegenerationTarget,
    setCalendarRegenerationTarget,
    phaseDialogUser,
    setPhaseDialogUser,
    savingCoachNoteKey: coachApplicationActions.savingCoachNoteKey,
    search,
    setSearch,
    userFilter,
    setUserFilter,
    phaseFilter,
    setPhaseFilter,
    selectedUser,
    canEditSelectedUser,
    canManageSelectedUserApiKeys,
    memberPickerGroup,
    coachPickerGroup,
    managerPickerGroup,
    assignableUsers,
    assignableCoaches,
    assignableManagers,
    groupedUsers,
    recentActivity,
    totalApplications,
    totalInterviews,
    totalDue,
    totalAccepted,
    totalRejected,
    phaseCounts,
    isDeletingGroup,
    loadDashboard,
    createGroup: coachGroupActions.createGroup,
    addMember: coachGroupActions.addMember,
    addCoach: coachGroupActions.addCoach,
    setGroupManager: coachGroupActions.setGroupManager,
    removeMember: coachGroupActions.removeMember,
    removeAssignedCoach: coachGroupActions.removeAssignedCoach,
    deleteGroup: coachGroupActions.deleteGroup,
    updateGroupPhase: coachGroupActions.updateGroupPhase,
    archiveGroup: coachGroupActions.archiveGroup,
    updateManagedUser: coachAdminActions.updateManagedUser,
    openManagedUserApiKeys: coachAdminActions.openManagedUserApiKeys,
    revokeManagedApiKey: coachAdminActions.revokeManagedApiKey,
    deleteUser: coachAdminActions.deleteUser,
    updateUserPhase,
    savePrivateCoachNote: coachApplicationActions.savePrivateCoachNote,
    createSharedCoachNote: coachApplicationActions.createSharedCoachNote,
    updateSharedCoachNote: coachApplicationActions.updateSharedCoachNote,
    deleteSharedCoachNote: coachApplicationActions.deleteSharedCoachNote,
    exportUserApplications: coachUtilities.exportUserApplications,
    exportGroupApplications: coachUtilities.exportGroupApplications,
    copyGroupCalendarUrl: coachUtilities.copyGroupCalendarUrl,
    copyAllGroupsCalendarUrl: coachUtilities.copyAllGroupsCalendarUrl,
    regenerateCalendarUrl: coachUtilities.regenerateCalendarUrl,
    undoLastAction,
    importApplicationsForUser: coachApplicationActions.importApplicationsForUser,
    updateManagedApplication: coachApplicationActions.updateManagedApplication,
    deleteManagedApplication: coachApplicationActions.deleteManagedApplication,
  };
}
