"use client";

import { useCallback, useMemo, useState } from "react";
import { buildCoachPrioritySections, isTrackedCoachBeneficiary } from "@/features/coach/utils";
import { useCoachDashboard } from "@/features/coach/useCoachDashboard";
import { useManagedUserEditor } from "@/features/coach/useManagedUserEditor";

export function useCoachPageState() {
  const coach = useCoachDashboard();
  const [activityTargetJobId, setActivityTargetJobId] = useState<string | null>(null);
  const managedUserEditor = useManagedUserEditor({
    onSubmit: coach.updateManagedUser,
  });

  const followedUserCount = useMemo(
    () =>
      coach.dashboard?.users.filter(
        (entry) => isTrackedCoachBeneficiary(entry)
      ).length ?? 0,
    [coach.dashboard?.users]
  );
  const prioritySections = useMemo(
    () => buildCoachPrioritySections(coach.dashboard?.users ?? []),
    [coach.dashboard?.users]
  );
  const isAuthorized =
    coach.user?.role === "coach" || coach.user?.role === "admin";

  const closeSelectedUserSheet = useCallback(
    (open: boolean) => {
      if (open) return;

      coach.setSelectedUserId(null);
      setActivityTargetJobId(null);
    },
    [coach]
  );

  const openUserFromActivity = useCallback(
    (userId: number, jobId?: string | null) => {
      setActivityTargetJobId(jobId ?? null);
      coach.setSelectedUserId(userId);
    },
    [coach]
  );

  const openSelectedUserEditor = useCallback(() => {
    if (!coach.selectedUser) return;

    managedUserEditor.openManagedUserEditor({
      userId: coach.selectedUser.id,
      email: coach.selectedUser.email,
      firstName: coach.selectedUser.firstName,
      lastName: coach.selectedUser.lastName,
      role: coach.selectedUser.role,
    });
  }, [coach.selectedUser, managedUserEditor]);

  const openSelectedUserDeletion = useCallback(() => {
    if (!coach.selectedUser) return;

    coach.setDeleteUserTarget({
      userId: coach.selectedUser.id,
      email: coach.selectedUser.email,
    });
  }, [coach]);

  const closePhaseDialog = useCallback(
    (open: boolean) => {
      if (open) return;
      coach.setPhaseDialogUser(null);
    },
    [coach]
  );

  const openSelectedUserPhaseChange = useCallback(() => {
    if (!coach.selectedUser) return;
    coach.setPhaseDialogUser(coach.selectedUser);
  }, [coach]);

  const resetApiKeysDialog = useCallback(
    (open: boolean) => {
      if (open) return;

      coach.setApiKeysTarget(null);
      coach.setRevokeApiKeyTarget(null);
    },
    [coach]
  );

  const requestRevokeApiKey = useCallback(
    (apiKey: (typeof coach.managedApiKeys)[number]) => {
      if (!coach.apiKeysTarget) return;

      coach.setRevokeApiKeyTarget({
        userId: coach.apiKeysTarget.userId,
        keyId: apiKey.id,
        keyName: apiKey.name,
        email: coach.apiKeysTarget.email,
      });
    },
    [coach]
  );

  const closeImportDialog = useCallback(
    (open: boolean) => {
      if (open) return;
      coach.setImportTargetUserId(null);
    },
    [coach]
  );

  return {
    ...coach,
    ...managedUserEditor,
    activityTargetJobId,
    followedUserCount,
    prioritySections,
    isAuthorized,
    closeSelectedUserSheet,
    openUserFromActivity,
    openSelectedUserEditor,
    openSelectedUserDeletion,
    closePhaseDialog,
    openSelectedUserPhaseChange,
    resetApiKeysDialog,
    requestRevokeApiKey,
    closeImportDialog,
  };
}

export type CoachPageState = ReturnType<typeof useCoachPageState>;
