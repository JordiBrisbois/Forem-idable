"use client";

import { useCallback, useState } from "react";
import { requestCoachApplicationNote } from "@/features/coach/coachDashboardApi";
import { JobApplication, JobApplicationPatch } from "@/types/application";

export function useCoachApplicationActions(input: {
  applyApplicationUpdate: (userId: number, application: JobApplication) => void;
  loadDashboard: (options?: { preserveFeedback?: boolean }) => Promise<void>;
  removeApplicationLocally: (userId: number, jobId: string) => void;
  setFeedback: (value: string | null) => void;
  onImportComplete?: () => void;
}) {
  const [isImportingApplications, setIsImportingApplications] = useState(false);
  const [savingCoachNoteKey, setSavingCoachNoteKey] = useState<string | null>(null);

  const savePrivateCoachNote = useCallback(
    async (userId: number, jobId: string, content: string) => {
      setSavingCoachNoteKey(`private:${jobId}`);

      const { response, data } = await requestCoachApplicationNote({
        userId,
        jobId,
        action: "save-private",
        content,
      });
      if (!response.ok) {
        input.setFeedback(data.error || "Note coach impossible à enregistrer.");
        setSavingCoachNoteKey(null);
        return false;
      }

      input.setFeedback("Note privée enregistrée.");
      if (data.application) {
        input.applyApplicationUpdate(userId, data.application);
      }
      setSavingCoachNoteKey(null);
      return true;
    },
    [input]
  );

  const createSharedCoachNote = useCallback(
    async (userId: number, jobId: string, content: string) => {
      setSavingCoachNoteKey(`create:${jobId}`);

      const { response, data } = await requestCoachApplicationNote({
        userId,
        jobId,
        action: "create-shared",
        content,
      });
      if (!response.ok) {
        input.setFeedback(data.error || "Note partagée impossible à créer.");
        setSavingCoachNoteKey(null);
        return false;
      }

      input.setFeedback("Note partagée enregistrée.");
      if (data.application) {
        input.applyApplicationUpdate(userId, data.application);
      }
      setSavingCoachNoteKey(null);
      return true;
    },
    [input]
  );

  const updateSharedCoachNote = useCallback(
    async (userId: number, jobId: string, noteId: string, content: string) => {
      setSavingCoachNoteKey(`shared:${noteId}`);

      const { response, data } = await requestCoachApplicationNote({
        userId,
        jobId,
        noteId,
        action: "update-shared",
        content,
      });
      if (!response.ok) {
        input.setFeedback(data.error || "Note partagée impossible à mettre à jour.");
        setSavingCoachNoteKey(null);
        return false;
      }

      input.setFeedback("Note partagée mise à jour.");
      if (data.application) {
        input.applyApplicationUpdate(userId, data.application);
      }
      setSavingCoachNoteKey(null);
      return true;
    },
    [input]
  );

  const deleteSharedCoachNote = useCallback(
    async (userId: number, jobId: string, noteId: string) => {
      setSavingCoachNoteKey(`delete:${noteId}`);

      const { response, data } = await requestCoachApplicationNote({
        userId,
        jobId,
        noteId,
        action: "delete-shared",
      });
      if (!response.ok) {
        input.setFeedback(data.error || "Suppression de la note partagée impossible.");
        setSavingCoachNoteKey(null);
        return false;
      }

      input.setFeedback("Note partagée supprimée.");
      if (data.application) {
        input.applyApplicationUpdate(userId, data.application);
      }
      setSavingCoachNoteKey(null);
      return true;
    },
    [input]
  );

  const importApplicationsForUser = useCallback(
    async (
      userId: number,
      dateFormat: "dmy" | "mdy",
      rows: Array<{
        company: string;
        contractType: string;
        title: string;
        location: string;
        appliedAt: string;
        status: string;
        notes: string;
      }>
    ) => {
      setIsImportingApplications(true);

      const response = await fetch(`/api/coach/users/${userId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFormat, rows }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        importedCount?: number;
        createdCount?: number;
        updatedCount?: number;
        ignoredCount?: number;
      };

      setIsImportingApplications(false);

      if (!response.ok) {
        input.setFeedback(data.error || "Import CSV impossible.");
        return null;
      }

      input.setFeedback(
        `Import CSV terminé: ${data.importedCount ?? rows.length} candidature${(data.importedCount ?? rows.length) > 1 ? "s" : ""} ajoutée${(data.importedCount ?? rows.length) > 1 ? "s" : ""}.`
      );
      input.onImportComplete?.();
      await input.loadDashboard({ preserveFeedback: true });
      return {
        importedCount: data.importedCount ?? rows.length,
        createdCount: data.createdCount ?? 0,
        updatedCount: data.updatedCount ?? 0,
        ignoredCount: data.ignoredCount ?? 0,
      };
    },
    [input]
  );

  const updateManagedApplication = useCallback(
    async (userId: number, jobId: string, patch: JobApplicationPatch) => {
      const response = await fetch(`/api/coach/users/${userId}/applications/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        application?: JobApplication;
      };

      if (!response.ok || !data.application) {
        input.setFeedback(data.error || "Mise à jour de la candidature impossible.");
        return false;
      }

      input.setFeedback("Candidature mise à jour.");
      input.applyApplicationUpdate(userId, data.application);
      return true;
    },
    [input]
  );

  const deleteManagedApplication = useCallback(
    async (userId: number, jobId: string) => {
      const response = await fetch(`/api/coach/users/${userId}/applications/${jobId}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        input.setFeedback(data.error || "Suppression de la candidature impossible.");
        return false;
      }

      input.setFeedback("Candidature supprimée.");
      input.removeApplicationLocally(userId, jobId);
      return true;
    },
    [input]
  );

  return {
    createSharedCoachNote,
    deleteManagedApplication,
    deleteSharedCoachNote,
    importApplicationsForUser,
    isImportingApplications,
    savePrivateCoachNote,
    savingCoachNoteKey,
    updateManagedApplication,
    updateSharedCoachNote,
  };
}
