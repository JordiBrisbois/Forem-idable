"use client";

import { Dispatch, SetStateAction, useCallback } from "react";
import { CoachDashboardData } from "@/types/coach";
import { AuthUser, UserRole } from "@/types/auth";
import { CoachUndoAction } from "@/features/coach/types";
import {
  createCoachGroup,
  addCoachGroupMember,
  addCoachGroupCoach,
  setCoachGroupManager,
  removeCoachGroupMember,
  removeCoachGroupCoach,
  deleteCoachGroup,
  archiveCoachGroup,
} from "@/lib/api/coachGroups";

export function useCoachGroupActions(input: {
  user: AuthUser | null;
  dashboard: CoachDashboardData | null;
  groupName: string;
  addCoachLocally: (groupId: number, userId: number) => void;
  addGroupLocally: (input: {
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
    initialCoach?: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      lastSeenAt: string | null;
    } | null;
  }) => void;
  addMembershipLocally: (groupId: number, userId: number) => void;
  loadDashboard: (options?: { preserveFeedback?: boolean }) => Promise<void>;
  removeCoachLocally: (groupId: number, userId: number) => void;
  removeGroupLocally: (groupId: number) => void;
  removeMembershipLocally: (groupId: number, userId: number) => void;
  replaceGroupIdLocally: (currentGroupId: number, nextGroupId: number) => void;
  setCoachPickerGroupId: Dispatch<SetStateAction<number | null>>;
  setDashboard: Dispatch<SetStateAction<CoachDashboardData | null>>;
  setFeedback: Dispatch<SetStateAction<string | null>>;
  setGroupName: Dispatch<SetStateAction<string>>;
  setIsCreateGroupOpen: Dispatch<SetStateAction<boolean>>;
  setManagerPickerGroupId: Dispatch<SetStateAction<number | null>>;
  setMemberPickerGroupId: Dispatch<SetStateAction<number | null>>;
  setUndoAction: Dispatch<SetStateAction<CoachUndoAction | null>>;
  setGroupManagerLocally: (groupId: number, coachId: number) => void;
  setIsDeletingGroup: Dispatch<SetStateAction<boolean>>;
}) {
  const createGroup = useCallback(async () => {
    const trimmedGroupName = input.groupName.trim();
    if (!trimmedGroupName) return;

    const temporaryGroupId = -Date.now();
    const createdAt = new Date().toISOString();
    const creatorEmail = input.user?.email ?? input.dashboard?.viewer.email ?? "";
    const creatorRole = input.user?.role;
    const creatorIsStaff = creatorRole === "coach" || creatorRole === "admin";

    input.addGroupLocally({
      id: temporaryGroupId,
      name: trimmedGroupName,
      createdAt,
      createdBy: {
        id: input.user?.id ?? 0,
        email: creatorEmail,
        firstName: input.user?.firstName ?? "",
        lastName: input.user?.lastName ?? "",
      },
      managerCoachId: creatorIsStaff ? input.user?.id ?? null : null,
      initialCoach: creatorIsStaff
        ? {
            id: input.user?.id ?? 0,
            email: creatorEmail,
            firstName: input.user?.firstName ?? "",
            lastName: input.user?.lastName ?? "",
            role: creatorRole ?? "coach",
            lastSeenAt: null,
          }
        : null,
    });

    try {
      const { data } = await createCoachGroup(trimmedGroupName);

      if (data.group?.id) {
        input.replaceGroupIdLocally(temporaryGroupId, data.group.id);
      }
    } catch {
      input.removeGroupLocally(temporaryGroupId);
      input.setFeedback("Création de la classe impossible.");
      return;
    }

    input.setUndoAction(null);
    input.setGroupName("");
    input.setIsCreateGroupOpen(false);
    input.setFeedback(`Classe créée: ${trimmedGroupName}.`);
  }, [input]);

  const addMember = useCallback(
    async (groupId: number, userId: number) => {
      input.addMembershipLocally(groupId, userId);
      try {
        await addCoachGroupMember(groupId, userId);
      } catch {
        input.removeMembershipLocally(groupId, userId);
        input.setFeedback("Ajout à la classe impossible.");
        return;
      }

      input.setUndoAction(null);
      input.setMemberPickerGroupId(null);
      input.setFeedback("Membre ajouté à la classe.");
    },
    [input]
  );

  const addCoach = useCallback(
    async (groupId: number, userId: number) => {
      input.addCoachLocally(groupId, userId);
      try {
        await addCoachGroupCoach(groupId, userId);
      } catch {
        input.removeCoachLocally(groupId, userId);
        input.setFeedback("Attribution du coach impossible.");
        return;
      }

      input.setUndoAction(null);
      input.setCoachPickerGroupId(null);
      input.setFeedback("Coach attribué à la classe.");
    },
    [input]
  );

  const setGroupManager = useCallback(
    async (groupId: number, userId: number) => {
      const previousManagerId =
        input.dashboard?.groups.find((entry) => entry.id === groupId)?.managerCoachId ?? null;
      input.setGroupManagerLocally(groupId, userId);
      try {
        await setCoachGroupManager(groupId, userId);
      } catch {
        input.setDashboard((current) => {
          if (!current) return current;
          return {
            ...current,
            groups: current.groups.map((entry) =>
              entry.id === groupId
                ? {
                    ...entry,
                    managerCoachId: previousManagerId,
                  }
                : entry
            ),
          };
        });
        input.setFeedback("Définition du manager impossible.");
        return;
      }

      input.setManagerPickerGroupId(null);
      input.setUndoAction(null);
      input.setFeedback("Manager de la classe mis à jour.");
    },
    [input]
  );

  const removeMember = useCallback(
    async (groupId: number, userId: number) => {
      const targetGroup = input.dashboard?.groups.find((group) => group.id === groupId);
      if (!targetGroup) {
        input.setFeedback("Classe introuvable.");
        return;
      }

      input.removeMembershipLocally(groupId, userId);
      try {
        await removeCoachGroupMember(groupId, userId);
      } catch {
        input.addMembershipLocally(groupId, userId);
        input.setFeedback("Suppression de la classe impossible.");
        return;
      }

      input.setUndoAction({
        type: "remove-membership",
        label: "Retrait de la classe effectué.",
        groupId,
        userId,
        groupName: targetGroup.name,
      });
      input.setFeedback("Membre retiré de la classe.");
    },
    [input]
  );

  const removeAssignedCoach = useCallback(
    async (groupId: number, userId: number) => {
      const previousManagerId =
        input.dashboard?.groups.find((entry) => entry.id === groupId)?.managerCoachId ?? null;
      input.removeCoachLocally(groupId, userId);
      try {
        await removeCoachGroupCoach(groupId, userId);
      } catch (error) {
        input.addCoachLocally(groupId, userId);
        if (previousManagerId) {
          input.setGroupManagerLocally(groupId, previousManagerId);
        }
        input.setFeedback(
          error instanceof Error ? error.message : "Retrait du coach impossible."
        );
        return;
      }

      input.setUndoAction(null);
      input.setFeedback("Coach retiré de la classe.");
    },
    [input]
  );

  const deleteGroup = useCallback(
    async (groupId: number) => {
      input.setIsDeletingGroup(true);
      input.removeGroupLocally(groupId);
      try {
        await deleteCoachGroup(groupId);
      } catch (error) {
        await input.loadDashboard();
        input.setFeedback(
          error instanceof Error ? error.message : "Suppression de la classe impossible."
        );
        input.setIsDeletingGroup(false);
        return;
      }

      input.setUndoAction(null);
      input.setFeedback("Classe supprimée.");
      input.setIsDeletingGroup(false);
    },
    [input]
  );

  const restoreMembership = useCallback(
    async (undoAction: Extract<CoachUndoAction, { type: "remove-membership" }>) => {
      input.addMembershipLocally(undoAction.groupId, undoAction.userId);
      try {
        await addCoachGroupMember(undoAction.groupId, undoAction.userId);
      } catch {
        input.removeMembershipLocally(undoAction.groupId, undoAction.userId);
        input.setFeedback("Impossible d'annuler le retrait de la classe.");
        return false;
      }

      input.setUndoAction(null);
      input.setFeedback("Retrait de la classe annulé.");
      return true;
    },
    [input]
  );

  const archiveGroup = useCallback(
    async (groupId: number, archived: boolean) => {
      input.setDashboard((current) => {
        if (!current) return current;
        return {
          ...current,
          groups: current.groups.map((group) =>
            group.id === groupId
              ? { ...group, archivedAt: archived ? new Date().toISOString() : null }
              : group
          ),
        };
      });

      try {
        await archiveCoachGroup(groupId, archived);
      } catch {
        input.setDashboard((current) => {
          if (!current) return current;
          return {
            ...current,
            groups: current.groups.map((group) =>
              group.id === groupId
                ? { ...group, archivedAt: archived ? null : new Date().toISOString() }
                : group
            ),
          };
        });
        input.setFeedback(archived ? "Archivage impossible." : "Désarchivage impossible.");
        return;
      }

      input.setUndoAction(null);
      input.setFeedback(archived ? "Classe archivée." : "Classe désarchivée.");
    },
    [input]
  );

  return {
    addCoach,
    addMember,
    archiveGroup,
    createGroup,
    deleteGroup,
    removeAssignedCoach,
    removeMember,
    restoreMembership,
    setGroupManager,
  };
}
