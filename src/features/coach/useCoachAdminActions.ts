"use client";

import { Dispatch, SetStateAction, useCallback } from "react";
import { fetchManagedUserApiKeys } from "@/features/coach/coachDashboardApi";
import {
  CoachApiKeysTarget,
  CoachDeleteUserTarget,
  CoachRevokeApiKeyTarget,
  CoachUndoAction,
} from "@/features/coach/types";
import { ApiKeySummary } from "@/types/externalApi";
import { CoachUserSummary } from "@/types/coach";
import { AuthUser } from "@/types/auth";

export function useCoachAdminActions(input: {
  user: AuthUser | null;
  selectedUser: CoachUserSummary | null;
  selectedUserId: number | null;
  apiKeysTarget: CoachApiKeysTarget | null;
  revokeApiKeyTarget: CoachRevokeApiKeyTarget | null;
  deleteUserTarget: CoachDeleteUserTarget | null;
  loadDashboard: (options?: { preserveFeedback?: boolean }) => Promise<void>;
  setApiKeysFeedback: Dispatch<SetStateAction<string | null>>;
  setApiKeysTarget: Dispatch<SetStateAction<CoachApiKeysTarget | null>>;
  setDeleteUserTarget: Dispatch<SetStateAction<CoachDeleteUserTarget | null>>;
  setFeedback: Dispatch<SetStateAction<string | null>>;
  setIsApiKeysLoading: Dispatch<SetStateAction<boolean>>;
  setIsDeletingUser: Dispatch<SetStateAction<boolean>>;
  setManagedApiKeys: Dispatch<SetStateAction<ApiKeySummary[]>>;
  setRevokeApiKeyTarget: Dispatch<SetStateAction<CoachRevokeApiKeyTarget | null>>;
  setSelectedUserId: Dispatch<SetStateAction<number | null>>;
  setUndoAction: Dispatch<SetStateAction<CoachUndoAction | null>>;
  updateManagedUserLocally: (
    userId: number,
    patch: Pick<CoachUserSummary, "firstName" | "lastName">
  ) => void;
}) {
  const updateManagedUser = useCallback(
    async (
      target: { userId: number; email: string },
      values: { firstName: string; lastName: string; password?: string }
    ) => {
      if (!values.firstName.trim() || !values.lastName.trim()) {
        input.setFeedback("Nom et prénom invalides.");
        return false;
      }

      const response = await fetch(`/api/admin/users/${target.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        input.setFeedback(data.error || "Mise à jour utilisateur impossible.");
        return false;
      }

      input.updateManagedUserLocally(target.userId, {
        firstName: values.firstName,
        lastName: values.lastName,
      });
      input.setUndoAction(null);
      input.setFeedback(`Utilisateur mis à jour: ${target.email}.`);
      return true;
    },
    [input]
  );

  const openManagedUserApiKeys = useCallback(async () => {
    if (!input.selectedUser || input.user?.role !== "admin") return;
    if (input.selectedUser.role !== "coach" && input.selectedUser.role !== "admin") return;

    input.setApiKeysTarget({
      userId: input.selectedUser.id,
      email: input.selectedUser.email,
      role: input.selectedUser.role,
    });
    input.setManagedApiKeys([]);
    input.setApiKeysFeedback(null);
    input.setIsApiKeysLoading(true);

    try {
      const { response, data } = await fetchManagedUserApiKeys(input.selectedUser.id);

      if (!response.ok || !data.apiKeys) {
        input.setApiKeysFeedback(data.error || "Chargement des clés API impossible.");
        return;
      }

      input.setManagedApiKeys(data.apiKeys);
    } catch {
      input.setApiKeysFeedback("Chargement des clés API impossible.");
    } finally {
      input.setIsApiKeysLoading(false);
    }
  }, [input]);

  const revokeManagedApiKey = useCallback(async () => {
    if (!input.revokeApiKeyTarget) return;

    const response = await fetch(
      `/api/admin/users/${input.revokeApiKeyTarget.userId}/api-keys/${input.revokeApiKeyTarget.keyId}`,
      { method: "DELETE" }
    );
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      input.setApiKeysFeedback(data.error || "Révocation impossible.");
      return;
    }

    input.setManagedApiKeys((current) =>
      current.filter((entry) => entry.id !== input.revokeApiKeyTarget?.keyId)
    );
    input.setApiKeysFeedback(`Clé API révoquée: ${input.revokeApiKeyTarget.keyName}.`);
    input.setRevokeApiKeyTarget(null);
  }, [input]);

  const deleteUser = useCallback(async () => {
    if (!input.deleteUserTarget) return;
    const target = input.deleteUserTarget;
    input.setIsDeletingUser(true);

    try {
      const response = await fetch(`/api/admin/users/${target.userId}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        input.setFeedback(data.error || "Suppression utilisateur impossible.");
        return;
      }

      input.setUndoAction(null);
      if (input.selectedUserId === target.userId) {
        input.setSelectedUserId(null);
      }
      input.setDeleteUserTarget(null);
      input.setFeedback(`Compte supprimé: ${target.email}.`);
      void input.loadDashboard({ preserveFeedback: true });
    } catch {
      input.setFeedback("Suppression utilisateur impossible.");
    } finally {
      input.setIsDeletingUser(false);
    }
  }, [input]);

  return {
    deleteUser,
    openManagedUserApiKeys,
    revokeManagedApiKey,
    updateManagedUser,
  };
}
