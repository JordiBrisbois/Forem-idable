"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { isFollowUpEnabled, shouldShowFollowUpDetails } from "@/features/applications/utils";
import { ApplicationStatus, JobApplication } from "@/types/application";

const formatApplicationsCount = (count: number) =>
  `${count} candidature${count > 1 ? "s" : ""}`;

export interface BulkMutationDeps {
  applications: JobApplication[];
  selectedJobIds: Set<string>;
  setSelectedJobIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedFollowUpCount: number;
  selectedFollowUpDisabledCount: number;
  notifyActionError: (message: string) => void;
  removeApplication: (jobId: string) => Promise<boolean>;
  updateFollowUpSettings: (
    jobId: string,
    input: { enabled: boolean; dueAt: string; status: ApplicationStatus }
  ) => Promise<boolean>;
  patchApplication: (
    jobId: string,
    patch: { status: ApplicationStatus; interviewAt: null; interviewDetails: null }
  ) => Promise<boolean>;
  detailsJobId: string | null;
  setDetailsJobId: React.Dispatch<React.SetStateAction<string | null>>;
}

type BulkDialogAction =
  | "delete-selected"
  | "disable-followup-selected"
  | "enable-followup-selected"
  | "change-status-selected"
  | null;

export function useBulkApplicationMutations(deps: BulkMutationDeps) {
  const {
    applications,
    selectedJobIds,
    setSelectedJobIds,
    selectedFollowUpCount,
    selectedFollowUpDisabledCount,
    notifyActionError,
    removeApplication,
    updateFollowUpSettings,
    patchApplication,
    detailsJobId,
    setDetailsJobId,
  } = deps;

  const [bulkDialogAction, setBulkDialogAction] = useState<BulkDialogAction>(null);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<ApplicationStatus | null>(null);
  const [isBulkMutating, setIsBulkMutating] = useState(false);

  const removeSelected = useCallback(() => {
    if (selectedJobIds.size === 0 || isBulkMutating) return;
    setBulkDialogAction("delete-selected");
  }, [isBulkMutating, selectedJobIds]);

  const confirmBulkDeleteSelected = useCallback(async () => {
    if (selectedJobIds.size === 0 || isBulkMutating) return;

    setIsBulkMutating(true);
    try {
      const results = await Promise.all(
        [...selectedJobIds].map(async (jobId) => ({
          jobId,
          ok: await removeApplication(jobId),
        }))
      );
      const failedIds = results.filter((entry) => !entry.ok).map((entry) => entry.jobId);
      const successIds = results.filter((entry) => entry.ok).map((entry) => entry.jobId);

      if (successIds.length > 0 && detailsJobId && successIds.includes(detailsJobId)) {
        setDetailsJobId(null);
      }

      setSelectedJobIds(new Set(failedIds));
      setBulkDialogAction(null);

      if (successIds.length === results.length) {
        toast.success(`${formatApplicationsCount(successIds.length)} supprimée${successIds.length > 1 ? "s" : ""}.`);
        return;
      }

      if (successIds.length > 0) {
        toast.error("Suppression partielle de la sélection.", {
          description: `${formatApplicationsCount(successIds.length)} supprimée${successIds.length > 1 ? "s" : ""}, ${formatApplicationsCount(failedIds.length)} en échec.`,
        });
        return;
      }

      notifyActionError("Impossible de supprimer la sélection.");
    } finally {
      setIsBulkMutating(false);
    }
  }, [detailsJobId, isBulkMutating, notifyActionError, removeApplication, selectedJobIds, setDetailsJobId, setSelectedJobIds]);

  const openDisableFollowUpDialog = useCallback(() => {
    if (selectedFollowUpCount === 0 || isBulkMutating) return;
    setBulkDialogAction("disable-followup-selected");
  }, [isBulkMutating, selectedFollowUpCount]);

  const openEnableFollowUpDialog = useCallback(() => {
    if (selectedFollowUpDisabledCount === 0 || isBulkMutating) return;
    setBulkDialogAction("enable-followup-selected");
  }, [isBulkMutating, selectedFollowUpDisabledCount]);

  const openChangeStatusDialog = useCallback((status: ApplicationStatus) => {
    if (selectedJobIds.size === 0 || isBulkMutating) return;
    setBulkTargetStatus(status);
    setBulkDialogAction("change-status-selected");
  }, [isBulkMutating, selectedJobIds]);

  const disableFollowUpForSelected = useCallback(async () => {
    if (isBulkMutating) return;

    const applicationsToDisable = applications.filter(
      (app) =>
        selectedJobIds.has(app.job.id) &&
        isFollowUpEnabled(app) &&
        shouldShowFollowUpDetails(app.status)
    );

    if (applicationsToDisable.length === 0) {
      setBulkDialogAction(null);
      notifyActionError("Aucune candidature avec relance active dans la sélection.");
      return;
    }

    setIsBulkMutating(true);
    try {
      const results = await Promise.all(
        applicationsToDisable.map(async (app) => ({
          jobId: app.job.id,
          ok: await updateFollowUpSettings(app.job.id, {
            enabled: false,
            dueAt: app.followUpDueAt,
            status: app.status,
          }),
        }))
      );
      const failedIds = results.filter((entry) => !entry.ok).map((entry) => entry.jobId);
      const successCount = results.length - failedIds.length;

      setSelectedJobIds(new Set(failedIds));
      setBulkDialogAction(null);

      if (successCount === results.length) {
        toast.success(`Relance désactivée pour ${formatApplicationsCount(successCount)}.`);
        return;
      }

      if (successCount > 0) {
        toast.error("Désactivation partielle des relances.", {
          description: `${formatApplicationsCount(successCount)} mise${successCount > 1 ? "s" : ""} à jour, ${formatApplicationsCount(failedIds.length)} en échec.`,
        });
        return;
      }

      notifyActionError("Impossible de désactiver les relances sélectionnées.");
    } finally {
      setIsBulkMutating(false);
    }
  }, [applications, isBulkMutating, notifyActionError, selectedJobIds, setSelectedJobIds, updateFollowUpSettings]);

  const enableFollowUpForSelected = useCallback(async () => {
    if (isBulkMutating) return;

    const applicationsToEnable = applications.filter(
      (app) =>
        selectedJobIds.has(app.job.id) &&
        !isFollowUpEnabled(app) &&
        shouldShowFollowUpDetails(app.status)
    );

    if (applicationsToEnable.length === 0) {
      setBulkDialogAction(null);
      notifyActionError("Aucune candidature avec relance désactivée dans la sélection.");
      return;
    }

    setIsBulkMutating(true);
    try {
      const results = await Promise.all(
        applicationsToEnable.map(async (app) => ({
          jobId: app.job.id,
          ok: await updateFollowUpSettings(app.job.id, {
            enabled: true,
            dueAt: app.followUpDueAt,
            status: app.status,
          }),
        }))
      );
      const failedIds = results.filter((entry) => !entry.ok).map((entry) => entry.jobId);
      const successCount = results.length - failedIds.length;

      setSelectedJobIds(new Set(failedIds));
      setBulkDialogAction(null);

      if (successCount === results.length) {
        toast.success(`Relance réactivée pour ${formatApplicationsCount(successCount)}.`);
        return;
      }

      if (successCount > 0) {
        toast.error("Réactivation partielle des relances.", {
          description: `${formatApplicationsCount(successCount)} mise${successCount > 1 ? "s" : ""} à jour, ${formatApplicationsCount(failedIds.length)} en échec.`,
        });
        return;
      }

      notifyActionError("Impossible de réactiver les relances sélectionnées.");
    } finally {
      setIsBulkMutating(false);
    }
  }, [applications, isBulkMutating, notifyActionError, selectedJobIds, setSelectedJobIds, updateFollowUpSettings]);

  const confirmBulkChangeStatus = useCallback(async () => {
    if (isBulkMutating) return;
    if (!bulkTargetStatus) return;

    if (bulkTargetStatus === "interview") {
      setBulkDialogAction(null);
      setBulkTargetStatus(null);
      notifyActionError("Le statut Entretien doit être défini avec une date.");
      return;
    }

    setIsBulkMutating(true);
    try {
      const results = await Promise.all(
        [...selectedJobIds].map(async (jobId) => ({
          jobId,
          ok: await patchApplication(jobId, {
            status: bulkTargetStatus,
            interviewAt: null,
            interviewDetails: null,
          }),
        }))
      );
      const failedIds = results.filter((entry) => !entry.ok).map((entry) => entry.jobId);
      const successCount = results.length - failedIds.length;

      setSelectedJobIds(new Set(failedIds));
      setBulkDialogAction(null);
      setBulkTargetStatus(null);

      if (successCount === results.length) {
        toast.success(`Statut mis à jour pour ${formatApplicationsCount(successCount)}.`);
        return;
      }

      if (successCount > 0) {
        toast.error("Mise à jour partielle du statut.", {
          description: `${formatApplicationsCount(successCount)} mise${successCount > 1 ? "s" : ""} à jour, ${formatApplicationsCount(failedIds.length)} en échec.`,
        });
        return;
      }

      notifyActionError("Impossible de modifier le statut de la sélection.");
    } finally {
      setIsBulkMutating(false);
    }
  }, [bulkTargetStatus, isBulkMutating, notifyActionError, patchApplication, selectedJobIds, setSelectedJobIds]);

  return {
    bulkDialogAction,
    bulkTargetStatus,
    isBulkMutating,
    setBulkDialogAction,
    setBulkTargetStatus,
    removeSelected,
    confirmBulkDeleteSelected,
    openDisableFollowUpDialog,
    openEnableFollowUpDialog,
    openChangeStatusDialog,
    disableFollowUpForSelected,
    enableFollowUpForSelected,
    confirmBulkChangeStatus,
  };
}
