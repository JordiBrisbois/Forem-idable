"use client";

import { useMemo, useState } from "react";
import { isManualApplication, sortApplicationsByMostRecent } from "@/features/applications/utils";
import {
  CoachApplicationEditDraft,
} from "@/features/coach/components/CoachApplicationEditor";
import {
  toEditableDate,
  toEditableDateTime,
  toIsoDate,
  toIsoDateTime,
} from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";
import { JobApplicationPatch } from "@/types/application";

interface UseCoachUserSheetStateInput {
  user: CoachUserSummary;
  initialJobId?: string | null;
  onUpdateApplication: (
    userId: number,
    jobId: string,
    patch: JobApplicationPatch
  ) => Promise<boolean>;
}

export function useCoachUserSheetState({
  user,
  initialJobId,
  onUpdateApplication,
}: UseCoachUserSheetStateInput) {
  const sortedApplications = useMemo(
    () => sortApplicationsByMostRecent(user.applications),
    [user.applications]
  );
  const applicationsPageSize = 10;
  const initialFocusPage = (() => {
    if (!initialJobId) {
      return 1;
    }

    const jobIndex = sortedApplications.findIndex((application) => application.job.id === initialJobId);
    if (jobIndex < 0) {
      return 1;
    }

    return Math.floor(jobIndex / applicationsPageSize) + 1;
  })();

  const [expandedJobIds, setExpandedJobIds] = useState<string[]>(initialJobId ? [initialJobId] : []);
  const [privateNoteDrafts, setPrivateNoteDrafts] = useState<Record<string, string>>({});
  const [sharedNoteDrafts, setSharedNoteDrafts] = useState<Record<string, string>>({});
  const [newSharedNoteDrafts, setNewSharedNoteDrafts] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(initialFocusPage);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [applicationDraft, setApplicationDraft] = useState<CoachApplicationEditDraft | null>(null);
  const [isSavingApplication, setIsSavingApplication] = useState(false);
  const [deleteApplicationTarget, setDeleteApplicationTarget] = useState<{
    jobId: string;
    title: string;
  } | null>(null);
  const [deleteSharedTarget, setDeleteSharedTarget] = useState<{
    jobId: string;
    noteId: string;
  } | null>(null);

  const pageCount = Math.max(1, Math.ceil(sortedApplications.length / applicationsPageSize));
  const effectivePage = Math.min(currentPage, pageCount);
  const paginatedApplications = useMemo(() => {
    const start = (effectivePage - 1) * applicationsPageSize;
    return sortedApplications.slice(start, start + applicationsPageSize);
  }, [effectivePage, sortedApplications]);

  const toggleExpanded = (jobId: string, nextOpen: boolean) => {
    setExpandedJobIds((current) =>
      nextOpen
        ? [...current.filter((entry) => entry !== jobId), jobId]
        : current.filter((entry) => entry !== jobId)
    );
  };

  const getPrivateDraft = (jobId: string, fallback?: string) =>
    privateNoteDrafts[jobId] ?? fallback ?? "";
  const getSharedDraft = (noteId: string, fallback: string) =>
    sharedNoteDrafts[noteId] ?? fallback;

  const openApplicationEditor = (application: CoachUserSummary["applications"][number]) => {
    const isManual = isManualApplication(application);
    setEditingJobId(application.job.id);
    setApplicationDraft({
      company: application.job.company || "",
      title: application.job.title,
      contractType: application.job.contractType || "",
      location: application.job.location || "",
      url: isManual ? "" : application.job.url || "",
      appliedAt: toEditableDate(application.appliedAt),
      status: application.status,
      notes: application.notes || "",
      proofs: application.proofs || "",
      interviewAt: toEditableDateTime(application.interviewAt),
      interviewDetails: application.interviewDetails || "",
      followUpEnabled: application.followUpEnabled !== false,
      followUpDueAt: toEditableDate(application.followUpDueAt),
    });
    if (!expandedJobIds.includes(application.job.id)) {
      setExpandedJobIds((current) => [...current, application.job.id]);
    }
  };

  const resetApplicationEditor = () => {
    setEditingJobId(null);
    setApplicationDraft(null);
    setIsSavingApplication(false);
  };

  const saveApplication = async (
    application: CoachUserSummary["applications"][number],
    draft: CoachApplicationEditDraft,
    isManual: boolean
  ) => {
    setIsSavingApplication(true);
    const saved = await onUpdateApplication(user.id, application.job.id, {
      status: draft.status,
      appliedAt: toIsoDate(draft.appliedAt) ?? application.appliedAt,
      notes: draft.notes,
      proofs: draft.proofs,
      interviewAt: toIsoDateTime(draft.interviewAt),
      interviewDetails: draft.interviewDetails,
      followUpEnabled: draft.followUpEnabled,
      followUpDueAt: toIsoDate(draft.followUpDueAt) ?? application.followUpDueAt,
      ...(isManual
        ? {
            job: {
              title: draft.title,
              company: draft.company,
              contractType: draft.contractType,
              location: draft.location,
              url: draft.url,
              publicationDate: application.job.publicationDate,
              source: application.job.source,
              description: application.job.description,
              pdfUrl: application.job.pdfUrl,
            },
          }
        : {}),
    });
    setIsSavingApplication(false);
    if (saved) {
      resetApplicationEditor();
    }
  };

  return {
    applicationsPageSize,
    sortedApplications,
    effectivePage,
    pageCount,
    paginatedApplications,
    expandedJobIds,
    currentPage,
    setCurrentPage,
    editingJobId,
    applicationDraft,
    setApplicationDraft,
    isSavingApplication,
    privateNoteDrafts,
    setPrivateNoteDrafts,
    sharedNoteDrafts,
    setSharedNoteDrafts,
    newSharedNoteDrafts,
    setNewSharedNoteDrafts,
    deleteApplicationTarget,
    setDeleteApplicationTarget,
    deleteSharedTarget,
    setDeleteSharedTarget,
    toggleExpanded,
    getPrivateDraft,
    getSharedDraft,
    openApplicationEditor,
    resetApplicationEditor,
    saveApplication,
  };
}
