"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminAuditLogs,
  createAdminDisclosureLog,
  createAdminLegalHold,
  fetchAdminAccountDeletionRequests,
  fetchAdminDisclosureLogs,
  fetchAdminLegalHolds,
  createAdminFeaturedSearch,
  deleteAdminFeaturedSearch,
  fetchAdminApiKeys,
  fetchAdminFeaturedSearches,
  releaseAdminLegalHold,
  revokeAdminApiKey,
  reviewAdminAccountDeletionRequest,
  updateAdminFeaturedSearch,
} from "@/features/admin/adminApi";
import { useAdminDashboard } from "@/features/admin/useAdminDashboard";
import { useAdminResource } from "@/features/admin/hooks/useAdminResource";
import { FeaturedSearchPayload } from "@/features/featured-searches/featuredSearchSchema";
import { AdminApiKeySummary } from "@/types/externalApi";
import { FeaturedSearch } from "@/types/featuredSearch";
import { AdminAccountDeletionRequest, AdminAuditLog, AdminDisclosureLog, AdminLegalHold } from "./adminApi";

export function useAdminPageState() {
  const admin = useAdminDashboard();

  const apiKeysState = useAdminResource<AdminApiKeySummary>({
    isAuthorized: admin.isAuthorized,
    fetchFn: fetchAdminApiKeys as () => ReturnType<typeof fetchAdminApiKeys>,
    extract: (data) => data.apiKeys as AdminApiKeySummary[] | undefined,
    errorMessage: "Chargement des clés API impossible.",
  });

  const featuredSearchesState = useAdminResource<FeaturedSearch>({
    isAuthorized: admin.isAuthorized,
    fetchFn: fetchAdminFeaturedSearches as () => ReturnType<typeof fetchAdminFeaturedSearches>,
    extract: (data) => data.featuredSearches as FeaturedSearch[] | undefined,
    errorMessage: "Chargement des recherches mises en avant impossible.",
  });

  const deletionRequestsState = useAdminResource<AdminAccountDeletionRequest>({
    isAuthorized: admin.isAuthorized,
    fetchFn: fetchAdminAccountDeletionRequests as () => ReturnType<typeof fetchAdminAccountDeletionRequests>,
    extract: (data) => data.requests as AdminAccountDeletionRequest[] | undefined,
    errorMessage: "Chargement des demandes impossible.",
  });

  const legalHoldsState = useAdminResource<AdminLegalHold>({
    isAuthorized: admin.isAuthorized,
    fetchFn: fetchAdminLegalHolds as () => ReturnType<typeof fetchAdminLegalHolds>,
    extract: (data) => data.holds as AdminLegalHold[] | undefined,
    errorMessage: "Chargement des legal holds impossible.",
  });

  const disclosureLogsState = useAdminResource<AdminDisclosureLog>({
    isAuthorized: admin.isAuthorized,
    fetchFn: fetchAdminDisclosureLogs as () => ReturnType<typeof fetchAdminDisclosureLogs>,
    extract: (data) => data.logs as AdminDisclosureLog[] | undefined,
    errorMessage: "Chargement des disclosure logs impossible.",
  });

  const auditLogsState = useAdminResource<AdminAuditLog>({
    isAuthorized: admin.isAuthorized,
    fetchFn: (async () => fetchAdminAuditLogs(200)) as () => ReturnType<typeof fetchAdminAuditLogs>,
    extract: (data) => data.logs as AdminAuditLog[] | undefined,
    errorMessage: "Chargement des audit logs impossible.",
  });

  const [revokeTarget, setRevokeTarget] = useState<AdminApiKeySummary | null>(null);
  const [isRevokingApiKey, setIsRevokingApiKey] = useState(false);
  const [isSavingFeaturedSearch, setIsSavingFeaturedSearch] = useState(false);
  const [savingFeaturedSearchId, setSavingFeaturedSearchId] = useState<number | null>(null);
  const [isDeletingFeaturedSearch, setIsDeletingFeaturedSearch] = useState(false);
  const [reviewingDeletionRequestId, setReviewingDeletionRequestId] = useState<number | null>(null);
  const [isCreatingLegalHold, setIsCreatingLegalHold] = useState(false);
  const [isReleasingLegalHold, setIsReleasingLegalHold] = useState(false);
  const [isCreatingDisclosureLog, setIsCreatingDisclosureLog] = useState(false);

  useEffect(() => {
    if (admin.isAuthLoading) return;
    if (!admin.isAuthorized) return;
    void apiKeysState.load();
    void featuredSearchesState.load();
    void deletionRequestsState.load();
    void legalHoldsState.load();
    void disclosureLogsState.load();
    void auditLogsState.load();
  }, [admin.isAuthLoading, admin.isAuthorized]); // eslint-disable-line react-hooks/exhaustive-deps

  const revokeApiKey = useCallback(async () => {
    if (!revokeTarget) return false;

    setIsRevokingApiKey(true);
    try {
      const { response, data } = await revokeAdminApiKey(revokeTarget.id);

      if (!response.ok) {
        apiKeysState.setFeedback(data.error || "Révocation impossible.");
        return false;
      }

      const revokedAt = new Date().toISOString();
      apiKeysState.setItems((current) =>
        current.map((entry) =>
          entry.id === revokeTarget.id
            ? {
                ...entry,
                revokedAt,
              }
            : entry
        )
      );
      apiKeysState.setFeedback(`Clé API révoquée: ${revokeTarget.name}.`);
      setRevokeTarget(null);
      return true;
    } catch {
      apiKeysState.setFeedback("Révocation impossible.");
      return false;
    } finally {
      setIsRevokingApiKey(false);
    }
  }, [revokeTarget, apiKeysState]);

  const createFeaturedSearch = useCallback(async (payload: FeaturedSearchPayload) => {
    setIsSavingFeaturedSearch(true);
    setSavingFeaturedSearchId(null);

    try {
      const { response, data } = await createAdminFeaturedSearch(payload);

      if (!response.ok || !data.featuredSearch) {
        featuredSearchesState.setFeedback(data.error || "Création impossible.");
        return false;
      }

      featuredSearchesState.setItems((current) =>
        [...current, data.featuredSearch!].sort((left, right) => left.sortOrder - right.sortOrder)
      );
      featuredSearchesState.setFeedback(`Recherche mise en avant créée: ${data.featuredSearch!.title}.`);
      return true;
    } catch {
      featuredSearchesState.setFeedback("Création impossible.");
      return false;
    } finally {
      setIsSavingFeaturedSearch(false);
      setSavingFeaturedSearchId(null);
    }
  }, [featuredSearchesState]);

  const updateFeaturedSearch = useCallback(async (id: number, payload: FeaturedSearchPayload) => {
    setIsSavingFeaturedSearch(true);
    setSavingFeaturedSearchId(id);

    try {
      const { response, data } = await updateAdminFeaturedSearch(id, payload);

      if (!response.ok || !data.featuredSearch) {
        featuredSearchesState.setFeedback(data.error || "Mise à jour impossible.");
        return false;
      }

      featuredSearchesState.setItems((current) =>
        current
          .map((entry) => (entry.id === id ? data.featuredSearch! : entry))
          .sort((left, right) => left.sortOrder - right.sortOrder)
      );
      featuredSearchesState.setFeedback(`Recherche mise en avant mise à jour: ${data.featuredSearch!.title}.`);
      return true;
    } catch {
      featuredSearchesState.setFeedback("Mise à jour impossible.");
      return false;
    } finally {
      setIsSavingFeaturedSearch(false);
      setSavingFeaturedSearchId(null);
    }
  }, [featuredSearchesState]);

  const deleteFeaturedSearch = useCallback(async (id: number) => {
    setIsDeletingFeaturedSearch(true);

    try {
      const target = featuredSearchesState.items.find((entry) => entry.id === id) ?? null;
      const { response, data } = await deleteAdminFeaturedSearch(id);

      if (!response.ok) {
        featuredSearchesState.setFeedback(data.error || "Suppression impossible.");
        return false;
      }

      featuredSearchesState.setItems((current) => current.filter((entry) => entry.id !== id));
      featuredSearchesState.setFeedback(
        target
          ? `Recherche mise en avant supprimée: ${target.title}.`
          : "Recherche mise en avant supprimée."
      );
      return true;
    } catch {
      featuredSearchesState.setFeedback("Suppression impossible.");
      return false;
    } finally {
      setIsDeletingFeaturedSearch(false);
    }
  }, [featuredSearchesState]);

  const reviewDeletionRequest = useCallback(async (input: {
    id: number;
    action: "approve" | "reject" | "complete";
    reviewNote?: string;
  }) => {
    setReviewingDeletionRequestId(input.id);

    try {
      const { response, data } = await reviewAdminAccountDeletionRequest(input.id, {
        action: input.action,
        reviewNote: input.reviewNote,
      });

      if (!response.ok) {
        deletionRequestsState.setFeedback(data.error || "Traitement impossible.");
        return false;
      }

      if (input.action === "complete") {
        deletionRequestsState.setItems((current) => current.filter((entry) => entry.id !== input.id));
        deletionRequestsState.setFeedback("Suppression finalisée.");
      } else if (data.request) {
        const request = data.request;
        deletionRequestsState.setItems((current) =>
          current.map((entry) =>
            entry.id === input.id
              ? {
                  ...entry,
                  ...request,
                  user: request.user ?? entry.user,
                }
              : entry
          )
        );
        deletionRequestsState.setFeedback(
          input.action === "approve" ? "Demande approuvée." : "Demande refusée."
        );
      }

      return true;
    } catch {
      deletionRequestsState.setFeedback("Traitement impossible.");
      return false;
    } finally {
      setReviewingDeletionRequestId(null);
    }
  }, [deletionRequestsState]);

  const createLegalHold = useCallback(async (payload: {
    targetType: "user" | "conversation" | "application";
    targetId: number;
    reason: string;
  }) => {
    setIsCreatingLegalHold(true);

    try {
      const { response, data } = await createAdminLegalHold(payload);

      if (!response.ok || !data.hold) {
        legalHoldsState.setFeedback(data.error || "Création du legal hold impossible.");
        return false;
      }

      legalHoldsState.setItems((current) => [data.hold!, ...current.filter((entry) => entry.id !== data.hold!.id)]);
      legalHoldsState.setFeedback("Legal hold créé.");
      return true;
    } catch {
      legalHoldsState.setFeedback("Création du legal hold impossible.");
      return false;
    } finally {
      setIsCreatingLegalHold(false);
    }
  }, [legalHoldsState]);

  const releaseLegalHold = useCallback(async (id: number) => {
    setIsReleasingLegalHold(true);

    try {
      const { response, data } = await releaseAdminLegalHold(id);

      if (!response.ok) {
        legalHoldsState.setFeedback(data.error || "Libération du legal hold impossible.");
        return false;
      }

      legalHoldsState.setItems((current) => current.filter((entry) => entry.id !== id));
      legalHoldsState.setFeedback("Legal hold libéré.");
      return true;
    } catch {
      legalHoldsState.setFeedback("Libération du legal hold impossible.");
      return false;
    } finally {
      setIsReleasingLegalHold(false);
    }
  }, [legalHoldsState]);

  const createDisclosureLog = useCallback(async (payload: {
    requestType?: "authority_request" | "litigation" | "other";
    authorityName: string;
    legalBasis?: string;
    targetType: "user" | "conversation" | "application" | "export" | "other";
    targetId?: number;
    scopeSummary: string;
    exportReference?: string;
  }) => {
    setIsCreatingDisclosureLog(true);

    try {
      const { response, data } = await createAdminDisclosureLog(payload);

      if (!response.ok || !data.log) {
        disclosureLogsState.setFeedback(data.error || "Journalisation impossible.");
        return false;
      }

      await disclosureLogsState.load();
      disclosureLogsState.setFeedback("Disclosure log ajouté.");
      return true;
    } catch {
      disclosureLogsState.setFeedback("Journalisation impossible.");
      return false;
    } finally {
      setIsCreatingDisclosureLog(false);
    }
  }, [disclosureLogsState]);

  const apiKeyStats = useMemo(() => {
    const now = Date.now();

    return {
      total: apiKeysState.items.length,
      active: apiKeysState.items.filter(
        (entry) =>
          !entry.revokedAt &&
          (!entry.expiresAt || new Date(entry.expiresAt).getTime() > now)
      ).length,
      revoked: apiKeysState.items.filter((entry) => Boolean(entry.revokedAt)).length,
      expiringSoon: apiKeysState.items.filter((entry) => {
        if (entry.revokedAt || !entry.expiresAt) return false;
        const expiresAt = new Date(entry.expiresAt).getTime();
        const fourteenDays = 14 * 24 * 60 * 60 * 1000;
        return expiresAt > now && expiresAt - now <= fourteenDays;
      }).length,
    };
  }, [apiKeysState.items]);

  return {
    ...admin,
    apiKeys: apiKeysState.items,
    apiKeysFeedback: apiKeysState.feedback,
    isApiKeysLoading: apiKeysState.isLoading,
    apiKeyStats,
    featuredSearches: featuredSearchesState.items,
    featuredSearchesFeedback: featuredSearchesState.feedback,
    isFeaturedSearchesLoading: featuredSearchesState.isLoading,
    isSavingFeaturedSearch,
    savingFeaturedSearchId,
    isDeletingFeaturedSearch,
    deletionRequests: deletionRequestsState.items,
    deletionRequestsFeedback: deletionRequestsState.feedback,
    isDeletionRequestsLoading: deletionRequestsState.isLoading,
    reviewingDeletionRequestId,
    legalHolds: legalHoldsState.items,
    legalHoldsFeedback: legalHoldsState.feedback,
    isLegalHoldsLoading: legalHoldsState.isLoading,
    isCreatingLegalHold,
    isReleasingLegalHold,
    disclosureLogs: disclosureLogsState.items,
    disclosureLogsFeedback: disclosureLogsState.feedback,
    isDisclosureLogsLoading: disclosureLogsState.isLoading,
    isCreatingDisclosureLog,
    auditLogs: auditLogsState.items,
    auditLogsFeedback: auditLogsState.feedback,
    isAuditLogsLoading: auditLogsState.isLoading,
    revokeTarget,
    setRevokeTarget,
    isRevokingApiKey,
    loadApiKeys: apiKeysState.load,
    revokeApiKey,
    loadFeaturedSearches: featuredSearchesState.load,
    loadDeletionRequests: deletionRequestsState.load,
    loadLegalHolds: legalHoldsState.load,
    loadDisclosureLogs: disclosureLogsState.load,
    loadAuditLogs: auditLogsState.load,
    createFeaturedSearch,
    updateFeaturedSearch,
    deleteFeaturedSearch,
    reviewDeletionRequest,
    createLegalHold,
    releaseLegalHold,
    createDisclosureLog,
  };
}

export type AdminPageState = ReturnType<typeof useAdminPageState>;
