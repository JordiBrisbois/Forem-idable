import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useApplicationsPageState } from "@/features/applications/hooks/useApplicationsPageState";
import { JobApplication } from "@/types/application";

const mockUseAuth = vi.fn();
const mockUseApplications = vi.fn();
const mockUseCoachNoteViews = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useApplications", () => ({
  useApplications: () => mockUseApplications(),
}));

vi.mock("@/features/applications/coachNoteViews", () => ({
  useCoachNoteViews: (...args: unknown[]) => mockUseCoachNoteViews(...args),
  markCoachNoteView: vi.fn(),
}));

vi.mock("@/lib/exportApplicationsCsv", () => ({
  exportApplicationsToCSV: vi.fn(),
}));

vi.mock("@/lib/exportApplicationsIcs", () => ({
  exportInterviewsToICS: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

function buildApplication(
  jobId: string,
  overrides: Partial<JobApplication> = {}
): JobApplication {
  return {
    job: {
      id: jobId,
      title: "Frontend Developer",
      company: "Acme",
      location: "Brussels",
      contractType: "CDI",
      publicationDate: "2026-03-10T10:00:00.000Z",
      url: `https://example.com/${jobId}`,
      source: "forem",
      ...overrides.job,
    },
    appliedAt: "2026-03-11T10:00:00.000Z",
    followUpDueAt: "2026-03-18T10:00:00.000Z",
    status: "in_progress",
    updatedAt: "2026-03-11T10:00:00.000Z",
    ...overrides,
  };
}

const application = buildApplication("job-1");

function buildUseApplicationsResult(overrides?: Partial<ReturnType<typeof mockUseApplications>>) {
  return {
    applications: [application],
    addManualApplication: vi.fn(),
    markAsInProgress: vi.fn(),
    markAsAccepted: vi.fn(),
    markAsRejected: vi.fn(),
    markAsFollowUp: vi.fn(),
    scheduleInterview: vi.fn().mockResolvedValue(true),
    clearInterview: vi.fn().mockResolvedValue(true),
    saveNotes: vi.fn().mockResolvedValue(true),
    saveProofs: vi.fn().mockResolvedValue(true),
    updateManualApplicationDetails: vi.fn().mockResolvedValue(true),
    markFollowUpDone: vi.fn().mockResolvedValue(true),
    updateFollowUpSettings: vi.fn().mockResolvedValue(true),
    removeApplication: vi.fn().mockResolvedValue(true),
    patchApplication: vi.fn().mockResolvedValue(true),
    isLoaded: true,
    ...overrides,
  };
}

describe("useApplicationsPageState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
      },
      isLoading: false,
    });
    mockUseCoachNoteViews.mockReturnValue({});
  });

  it("keeps the interview dialog open when interview scheduling fails", async () => {
    const scheduleInterview = vi.fn().mockResolvedValue(false);
    mockUseApplications.mockReturnValue(
      buildUseApplicationsResult({
        scheduleInterview,
      })
    );

    const { result } = renderHook(() => useApplicationsPageState());

    await act(async () => {
      result.current.openInterviewModal(application);
    });

    await act(async () => {
      result.current.setInterviewForm({
        interviewAt: "2026-03-29T14:30",
        interviewDetails: "Visio RH",
      });
    });

    await act(async () => {
      await result.current.submitInterview();
    });

    expect(scheduleInterview).toHaveBeenCalledWith(
      "job-1",
      "2026-03-29T14:30:00.000Z",
      "Visio RH"
    );
    expect(mockToastError).toHaveBeenCalledWith(
      "Impossible d'enregistrer l'entretien.",
      { description: "Candidatures" }
    );
    await waitFor(() => {
      expect(result.current.interviewApplication?.job.id).toBe("job-1");
    });
  });

  it("keeps only failed applications selected when a bulk delete is partial", async () => {
    const applications = [buildApplication("job-1"), buildApplication("job-2")];
    const removeApplication = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    mockUseApplications.mockReturnValue(
      buildUseApplicationsResult({
        applications,
        removeApplication,
      })
    );

    const { result } = renderHook(() => useApplicationsPageState());

    act(() => {
      result.current.toggleSelection("job-1");
      result.current.toggleSelection("job-2");
      result.current.openDetails("job-1");
    });

    await act(async () => {
      await result.current.confirmBulkDeleteSelected();
    });

    expect(removeApplication).toHaveBeenNthCalledWith(1, "job-1");
    expect(removeApplication).toHaveBeenNthCalledWith(2, "job-2");
    expect(result.current.selectedJobIds).toEqual(new Set(["job-2"]));
    expect(result.current.detailsJobId).toBeNull();
    expect(mockToastError).toHaveBeenCalledWith("Suppression partielle de la sélection.", {
      description: "1 candidature supprimée, 1 candidature en échec.",
    });
  });

  it("keeps only failed applications selected when a bulk follow-up disable is partial", async () => {
    const applications = [
      buildApplication("job-1", { status: "in_progress", followUpEnabled: true }),
      buildApplication("job-2", { status: "follow_up", followUpEnabled: true }),
    ];
    const updateFollowUpSettings = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    mockUseApplications.mockReturnValue(
      buildUseApplicationsResult({
        applications,
        updateFollowUpSettings,
      })
    );

    const { result } = renderHook(() => useApplicationsPageState());

    act(() => {
      result.current.toggleSelection("job-1");
      result.current.toggleSelection("job-2");
    });

    await act(async () => {
      await result.current.disableFollowUpForSelected();
    });

    expect(updateFollowUpSettings).toHaveBeenNthCalledWith(1, "job-1", {
      enabled: false,
      dueAt: applications[0].followUpDueAt,
      status: "in_progress",
    });
    expect(updateFollowUpSettings).toHaveBeenNthCalledWith(2, "job-2", {
      enabled: false,
      dueAt: applications[1].followUpDueAt,
      status: "follow_up",
    });
    expect(result.current.selectedJobIds).toEqual(new Set(["job-2"]));
    expect(mockToastError).toHaveBeenCalledWith("Désactivation partielle des relances.", {
      description: "1 candidature mise à jour, 1 candidature en échec.",
    });
  });

  it("blocks bulk interview status changes without scheduling a date", async () => {
    const patchApplication = vi.fn().mockResolvedValue(true);
    mockUseApplications.mockReturnValue(
      buildUseApplicationsResult({
        patchApplication,
      })
    );

    const { result } = renderHook(() => useApplicationsPageState());

    act(() => {
      result.current.toggleSelection("job-1");
    });

    await waitFor(() => {
      expect(result.current.selectedJobIds).toEqual(new Set(["job-1"]));
    });

    act(() => {
      result.current.openChangeStatusDialog("interview");
    });

    await waitFor(() => {
      expect(result.current.bulkTargetStatus).toBe("interview");
    });

    await act(async () => {
      await result.current.confirmBulkChangeStatus();
    });

    expect(patchApplication).not.toHaveBeenCalled();
    expect(result.current.bulkDialogAction).toBeNull();
    expect(result.current.bulkTargetStatus).toBeNull();
    expect(mockToastError).toHaveBeenCalledWith(
      "Le statut Entretien doit être défini avec une date.",
      { description: "Candidatures" }
    );
  });
});
