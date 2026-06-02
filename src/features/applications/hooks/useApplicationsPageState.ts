"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { useApplications } from "@/hooks/useApplications";
import { useApplicationSelection } from "@/features/applications/hooks/useApplicationSelection";
import { useBulkApplicationMutations } from "@/features/applications/hooks/useBulkApplicationMutations";
import { useApplicationDialogs } from "@/features/applications/hooks/useApplicationDialogs";
import { useApplicationDrafts } from "@/features/applications/hooks/useApplicationDrafts";
import {
  ApplicationModeFilter,
  countClosedApplications,
  countUpcomingInterviews,
  filterApplications,
  getApplicationsDueSummary,
  getLatestSharedCoachNoteAt,
  isApplicationFollowUpDue,
} from "@/features/applications/utils";
import {
  markCoachNoteView,
  useCoachNoteViews,
} from "@/features/applications/coachNoteViews";
import { exportApplicationsToCSV } from "@/lib/exportApplicationsCsv";
import { exportInterviewsToICS } from "@/lib/exportApplicationsIcs";
import { ApplicationStatus, JobApplication } from "@/types/application";
import {
  InterviewFormState,
} from "@/features/applications/components/InterviewDialog";
import {
  ManualApplicationFormState,
} from "@/features/applications/components/ManualApplicationDialog";

const APPLICATIONS_PAGE_SIZE = 20;

function createManualForm(): ManualApplicationFormState {
  return {
    company: "",
    title: "",
    contractType: "",
    location: "",
    appliedAt: format(new Date(), "yyyy-MM-dd"),
    status: "in_progress",
    notes: "",
    proofs: "",
    url: "",
  };
}

function createEmptyInterviewForm(): InterviewFormState {
  return {
    interviewAt: "",
    interviewDetails: "",
  };
}

export function useApplicationsPageState() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    applications,
    addManualApplication,
    markAsInProgress: persistInProgress,
    markAsAccepted: persistAccepted,
    markAsRejected: persistRejected,
    markAsFollowUp: persistFollowUp,
    scheduleInterview: persistInterview,
    clearInterview: persistInterviewClear,
    saveNotes,
    saveProofs,
    updateManualApplicationDetails,
    markFollowUpDone: persistFollowUpDone,
    updateFollowUpSettings,
    removeApplication,
    patchApplication,
    isLoaded,
  } = useApplications();
  const dialogs = useApplicationDialogs();
  const drafts = useApplicationDrafts();
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<ApplicationModeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [manualForm, setManualForm] = useState<ManualApplicationFormState>(createManualForm);
  const [interviewForm, setInterviewForm] = useState<InterviewFormState>(createEmptyInterviewForm);
  const now = useMemo(() => new Date(), []);
  const coachNoteViews = useCoachNoteViews(user?.id);

  // Pre-fill manual application form from query params (e.g. from Scout)
  // This is a one-shot initialization on mount; disabling the linter rule
  // that forbids setState inside effects because there is no cleaner
  // way to synchronise form state with external URL data on first render.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const company = params.get("company");
    const url = params.get("url");
    const location = params.get("location");

    if (company || url || location) {
      setManualForm((prev) => ({
        ...prev,
        company: company ?? prev.company,
        url: url ?? prev.url,
        location: location ?? prev.location,
      }));
      dialogs.openCreate();
      // Clean query params so refresh doesn't reopen the dialog
      window.history.replaceState({}, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasUnreadCoachUpdate = useCallback((application: JobApplication) => {
    const latestSharedNoteAt = getLatestSharedCoachNoteAt(application);
    if (!latestSharedNoteAt) return false;
    const seenAt = coachNoteViews[application.job.id];
    if (!seenAt) return true;
    return new Date(latestSharedNoteAt).getTime() > new Date(seenAt).getTime();
  }, [coachNoteViews]);

  const dueCount = useMemo(
    () => applications.filter((entry) => isApplicationFollowUpDue(entry)).length,
    [applications]
  );
  const dueSummary = useMemo(() => getApplicationsDueSummary(applications), [applications]);
  const upcomingInterviewCount = useMemo(
    () => countUpcomingInterviews(applications, now),
    [applications, now]
  );
  const closedCount = useMemo(() => countClosedApplications(applications), [applications]);
  const unreadCoachUpdateCount = useMemo(
    () => applications.filter((entry) => hasUnreadCoachUpdate(entry)).length,
    [applications, hasUnreadCoachUpdate]
  );
  const hasCoachContext = useMemo(
    () => applications.some((entry) => (entry.sharedCoachNotes?.length ?? 0) > 0),
    [applications]
  );
  const filteredApplications = useMemo(() => {
    return filterApplications(applications, {
      search,
      modeFilter,
      hasUnreadCoachUpdate,
    });
  }, [applications, hasUnreadCoachUpdate, modeFilter, search]);

  const {
    selectedJobIds,
    setSelectedJobIds,
    toggleSelection,
    clearSelection,
    isAllSelected,
    toggleSelectAll,
    selectedFollowUpCount,
    selectedFollowUpDisabledCount,
  } = useApplicationSelection({
    visibleApplications: filteredApplications,
    allApplications: applications,
  });

  const applicationsPageCount = Math.max(
    1,
    Math.ceil(filteredApplications.length / APPLICATIONS_PAGE_SIZE)
  );
  const effectiveApplicationsPage = Math.min(currentPage, applicationsPageCount);
  const paginatedApplications = useMemo(() => {
    const start = (effectiveApplicationsPage - 1) * APPLICATIONS_PAGE_SIZE;
    return filteredApplications.slice(start, start + APPLICATIONS_PAGE_SIZE);
  }, [effectiveApplicationsPage, filteredApplications]);

  const selectedApplication = useMemo(
    () => applications.find((entry) => entry.job.id === dialogs.detailsJobId) ?? null,
    [applications, dialogs.detailsJobId]
  );
  const deleteApplication = useMemo(
    () => applications.find((entry) => entry.job.id === dialogs.deleteJobId) ?? null,
    [applications, dialogs.deleteJobId]
  );
  const interviewApplication = useMemo(
    () => applications.find((entry) => entry.job.id === dialogs.interviewJobId) ?? null,
    [applications, dialogs.interviewJobId]
  );
  const currentNotesDraft = selectedApplication
    ? drafts.notesDrafts[selectedApplication.job.id] ?? (selectedApplication.notes ?? "")
    : "";
  const currentProofsDraft = selectedApplication
    ? drafts.proofsDrafts[selectedApplication.job.id] ?? (selectedApplication.proofs ?? "")
    : "";

  const resetManualForm = useCallback(() => {
    setManualForm(createManualForm());
  }, []);

  const resetInterviewDialog = useCallback(() => {
    dialogs.closeInterview();
    setInterviewForm(createEmptyInterviewForm());
  }, [dialogs]);

  const notifyActionError = useCallback((message: string) => {
    toast.error(message, { description: "Candidatures" });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleModeFilterChange = useCallback((value: ApplicationModeFilter) => {
    setModeFilter(value);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setModeFilter("all");
    setCurrentPage(1);
  }, []);

  const markCoachUpdateSeen = useCallback((application: JobApplication | null) => {
    if (!application) return;
    markCoachNoteView(user?.id, application.job.id, getLatestSharedCoachNoteAt(application));
  }, [user?.id]);

  const openDetails = useCallback((jobId: string) => {
    dialogs.openDetails(jobId);
    markCoachUpdateSeen(applications.find((entry) => entry.job.id === jobId) ?? null);
  }, [applications, dialogs, markCoachUpdateSeen]);

  const applyStatus = useCallback((jobId: string, status: ApplicationStatus) => {
    void (async () => {
      if (status === "accepted") {
        const saved = await persistAccepted(jobId);
        if (!saved) notifyActionError("Impossible de passer la candidature en acceptée.");
        return;
      }
      if (status === "rejected") {
        const saved = await persistRejected(jobId);
        if (!saved) notifyActionError("Impossible de passer la candidature en refusée.");
        return;
      }
      if (status === "follow_up") {
        const saved = await persistFollowUp(jobId);
        if (!saved) notifyActionError("Impossible de marquer la candidature en relance.");
        return;
      }
      if (status === "interview") {
        const existing = applications.find((entry) => entry.job.id === jobId);
        if (existing?.interviewAt) {
          const saved = await persistInterview(
            jobId,
            existing.interviewAt,
            existing.interviewDetails ?? undefined
          );
          if (!saved) notifyActionError("Impossible de mettre à jour l'entretien.");
        } else {
          dialogs.openInterview(jobId);
          setInterviewForm({
            interviewAt: "",
            interviewDetails: existing?.interviewDetails ?? "",
          });
        }
        return;
      }

      const saved = await persistInProgress(jobId);
      if (!saved) notifyActionError("Impossible de repasser la candidature en cours.");
    })();
  }, [
    applications,
    dialogs,
    notifyActionError,
    persistAccepted,
    persistFollowUp,
    persistInProgress,
    persistInterview,
    persistRejected,
    setInterviewForm,
  ]);

  const bulkMutations = useBulkApplicationMutations({
    applications,
    selectedJobIds,
    setSelectedJobIds,
    selectedFollowUpCount,
    selectedFollowUpDisabledCount,
    notifyActionError,
    removeApplication,
    updateFollowUpSettings,
    patchApplication,
    detailsJobId: dialogs.detailsJobId,
    setDetailsJobId: dialogs.closeDetails,
  });

  const submitManualForm = useCallback(async () => {
    if (!manualForm.company.trim() || !manualForm.title.trim()) return;

    const saved = await addManualApplication({
      company: manualForm.company.trim(),
      title: manualForm.title.trim(),
      contractType: manualForm.contractType.trim(),
      location: manualForm.location.trim(),
      appliedAt: manualForm.appliedAt,
      status: manualForm.status,
      notes: manualForm.notes.trim(),
      proofs: manualForm.proofs.trim(),
      url: manualForm.url.trim(),
    });
    if (!saved) {
      notifyActionError("Impossible d'ajouter la candidature manuelle.");
      return;
    }

    resetManualForm();
    dialogs.closeCreate();
  }, [addManualApplication, dialogs, manualForm, notifyActionError, resetManualForm]);

  const openInterviewModal = useCallback((application: JobApplication) => {
    const date = application.interviewAt ? new Date(application.interviewAt) : null;
    const interviewAt =
      date && !Number.isNaN(date.getTime()) ? format(date, "yyyy-MM-dd'T'HH:mm") : "";

    dialogs.openInterview(application.job.id);
    setInterviewForm({
      interviewAt,
      interviewDetails: application.interviewDetails ?? "",
    });
  }, [dialogs]);

  const submitInterview = useCallback(async () => {
    if (!interviewApplication || !interviewForm.interviewAt) return;

    const interviewAt = new Date(interviewForm.interviewAt);
    if (Number.isNaN(interviewAt.getTime())) return;

    const saved = await persistInterview(
      interviewApplication.job.id,
      interviewAt.toISOString(),
      interviewForm.interviewDetails.trim()
    );
    if (saved) {
      resetInterviewDialog();
      return;
    }
    notifyActionError("Impossible d'enregistrer l'entretien.");
  }, [interviewApplication, interviewForm, notifyActionError, persistInterview, resetInterviewDialog]);

  const removeInterview = useCallback(async () => {
    if (!interviewApplication) return;
    const cleared = await persistInterviewClear(interviewApplication.job.id);
    if (cleared) {
      resetInterviewDialog();
      return;
    }
    notifyActionError("Impossible de supprimer l'entretien.");
  }, [interviewApplication, notifyActionError, persistInterviewClear, resetInterviewDialog]);

  const saveSelectedNotes = useCallback(async () => {
    if (!selectedApplication) return;
    const saved = await saveNotes(selectedApplication.job.id, currentNotesDraft);
    if (!saved) {
      notifyActionError("Impossible d'enregistrer les notes.");
      return;
    }
      drafts.clearDrafts(selectedApplication.job.id);
  }, [currentNotesDraft, drafts, notifyActionError, saveNotes, selectedApplication]);

  const saveSelectedProofs = useCallback(async () => {
    if (!selectedApplication) return;
    const saved = await saveProofs(selectedApplication.job.id, currentProofsDraft);
    if (!saved) {
      notifyActionError("Impossible d'enregistrer les preuves.");
      return;
    }
      drafts.clearDrafts(selectedApplication.job.id);
  }, [currentProofsDraft, drafts, notifyActionError, saveProofs, selectedApplication]);

  const confirmDelete = useCallback(() => {
    if (!deleteApplication) return;
    void (async () => {
      const deleted = await removeApplication(deleteApplication.job.id);
      if (!deleted) {
        notifyActionError("Impossible de supprimer la candidature.");
        return;
      }

      if (dialogs.detailsJobId === deleteApplication.job.id) dialogs.closeDetails();
      dialogs.closeDelete();
    })();
  }, [deleteApplication, dialogs, notifyActionError, removeApplication]);

  const markFollowUpDone = useCallback((jobId: string) => {
    void (async () => {
      const saved = await persistFollowUpDone(jobId);
      if (!saved) {
        notifyActionError("Impossible d'enregistrer la relance.");
      }
    })();
  }, [notifyActionError, persistFollowUpDone]);

  return {
    user,
    isAuthLoading,
    isLoaded,
    applications,
    filteredApplications,
    paginatedApplications,
    selectedJobIds,
    isAllSelected,
    selectedFollowUpCount,
    selectedFollowUpDisabledCount,
    ...bulkMutations,
    ...dialogs,
    search,
    modeFilter,
    currentPage,
    manualForm,
    interviewForm,
    now,
    dueCount,
    dueSummary,
    upcomingInterviewCount,
    closedCount,
    unreadCoachUpdateCount,
    hasCoachContext,
    pageSize: APPLICATIONS_PAGE_SIZE,
    applicationsPageCount,
    effectiveApplicationsPage,
    selectedApplication,
    deleteApplication,
    interviewApplication,
    currentNotesDraft,
    currentProofsDraft,
    hasUnreadCoachUpdate,
    setManualForm,
    setInterviewForm,
    setCurrentPage,
    setNotesDraft: drafts.setNotesDraft,
    setProofsDraft: drafts.setProofsDraft,
    handleSearchChange,
    handleModeFilterChange,
    resetFilters,
    openDetails,
    applyStatus,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    submitManualForm,
    openInterviewModal,
    submitInterview,
    removeInterview,
    saveSelectedNotes,
    saveSelectedProofs,
    confirmDelete,
    resetManualForm,
    resetInterviewDialog,
    markFollowUpDone,
    updateManualApplicationDetails,
    updateFollowUpSettings,
    exportApplications: () => exportApplicationsToCSV(filteredApplications),
    exportCalendar: () => exportInterviewsToICS(filteredApplications),
  };
}
