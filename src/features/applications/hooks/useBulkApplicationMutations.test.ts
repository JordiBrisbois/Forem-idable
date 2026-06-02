import { act, renderHook } from "@testing-library/react";
import { useBulkApplicationMutations } from "./useBulkApplicationMutations";
import { ApplicationStatus, JobApplication } from "@/types/application";

function buildApp(id: string, overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    job: {
      id,
      title: "Développeur",
      company: "ACME",
      location: "Bruxelles",
      contractType: "CDI",
      publicationDate: "2026-01-01T00:00:00.000Z",
      url: "https://example.com",
      source: "forem",
    },
    sourceType: "tracked",
    appliedAt: "2026-03-01T10:00:00.000Z",
    followUpDueAt: "2026-03-15T10:00:00.000Z",
    followUpEnabled: true,
    status: "in_progress" as ApplicationStatus,
    updatedAt: "2026-03-01T10:00:00.000Z",
    ...overrides,
  };
}

function setup(depsOverrides: Partial<Parameters<typeof useBulkApplicationMutations>[0]> = {}) {
  const applications = [
    buildApp("a"),
    buildApp("b", { followUpEnabled: false }),
    buildApp("c", { status: "accepted" }),
  ];

  const selectedJobIds = new Set(["a", "b"]);
  const setSelectedJobIds = vi.fn();
  const notifyActionError = vi.fn();
  const removeApplication = vi.fn(async () => true);
  const updateFollowUpSettings = vi.fn(async () => true);
  const patchApplication = vi.fn(async () => true);
  const setDetailsJobId = vi.fn();

  const deps = {
    applications,
    selectedJobIds,
    setSelectedJobIds,
    selectedFollowUpCount: 1,
    selectedFollowUpDisabledCount: 1,
    notifyActionError,
    removeApplication,
    updateFollowUpSettings,
    patchApplication,
    detailsJobId: null,
    setDetailsJobId,
    ...depsOverrides,
  };

  return {
    ...renderHook(() => useBulkApplicationMutations(deps)),
    deps,
  };
}

describe("useBulkApplicationMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with idle state", () => {
    const { result } = setup();
    expect(result.current.bulkDialogAction).toBeNull();
    expect(result.current.isBulkMutating).toBe(false);
    expect(result.current.bulkTargetStatus).toBeNull();
  });

  it("opens delete dialog when apps are selected", () => {
    const { result } = setup();
    act(() => result.current.removeSelected());
    expect(result.current.bulkDialogAction).toBe("delete-selected");
  });

  it("does not open delete dialog when empty selection", () => {
    const { result } = setup({ selectedJobIds: new Set() });
    act(() => result.current.removeSelected());
    expect(result.current.bulkDialogAction).toBeNull();
  });

  it("confirms bulk delete and clears selection on success", async () => {
    const { result, deps } = setup();
    act(() => result.current.removeSelected());

    await act(async () => {
      await result.current.confirmBulkDeleteSelected();
    });

    expect(deps.removeApplication).toHaveBeenCalledTimes(2);
    expect(deps.setSelectedJobIds).toHaveBeenCalledWith(new Set());
    expect(result.current.bulkDialogAction).toBeNull();
  });

  it("keeps failed ids in selection after partial delete", async () => {
    const { result, deps } = setup({
      removeApplication: vi.fn(async (id: string) => id !== "a"),
    });
    act(() => result.current.removeSelected());

    await act(async () => {
      await result.current.confirmBulkDeleteSelected();
    });

    expect(deps.setSelectedJobIds).toHaveBeenCalledWith(new Set(["a"]));
  });

  it("closes details sheet if deleted app was open", async () => {
    const { result, deps } = setup({
      detailsJobId: "a",
      removeApplication: vi.fn(async () => true),
    });
    act(() => result.current.removeSelected());

    await act(async () => {
      await result.current.confirmBulkDeleteSelected();
    });

    expect(deps.setDetailsJobId).toHaveBeenCalledWith(null);
  });

  it("opens disable follow-up dialog when eligible", () => {
    const { result } = setup();
    act(() => result.current.openDisableFollowUpDialog());
    expect(result.current.bulkDialogAction).toBe("disable-followup-selected");
  });

  it("does not open disable dialog when count is zero", () => {
    const { result } = setup({ selectedFollowUpCount: 0 });
    act(() => result.current.openDisableFollowUpDialog());
    expect(result.current.bulkDialogAction).toBeNull();
  });

  it("disables follow-up for selected applications", async () => {
    const { result, deps } = setup();
    act(() => result.current.openDisableFollowUpDialog());

    await act(async () => {
      await result.current.disableFollowUpForSelected();
    });

    expect(deps.updateFollowUpSettings).toHaveBeenCalledWith("a", {
      enabled: false,
      dueAt: "2026-03-15T10:00:00.000Z",
      status: "in_progress",
    });
    expect(deps.updateFollowUpSettings).not.toHaveBeenCalledWith("b", expect.anything());
  });

  it("enables follow-up for selected applications", async () => {
    const { result, deps } = setup();
    act(() => result.current.openEnableFollowUpDialog());

    await act(async () => {
      await result.current.enableFollowUpForSelected();
    });

    expect(deps.updateFollowUpSettings).toHaveBeenCalledWith("b", {
      enabled: true,
      dueAt: "2026-03-15T10:00:00.000Z",
      status: "in_progress",
    });
    expect(deps.updateFollowUpSettings).not.toHaveBeenCalledWith("a", expect.anything());
  });

  it("opens change status dialog and sets target status", () => {
    const { result } = setup();
    act(() => result.current.openChangeStatusDialog("accepted"));
    expect(result.current.bulkDialogAction).toBe("change-status-selected");
    expect(result.current.bulkTargetStatus).toBe("accepted");
  });

  it("blocks bulk interview status with error", async () => {
    const { result, deps } = setup();
    act(() => result.current.openChangeStatusDialog("interview"));

    await act(async () => {
      await result.current.confirmBulkChangeStatus();
    });

    expect(deps.notifyActionError).toHaveBeenCalledWith(
      "Le statut Entretien doit être défini avec une date."
    );
    expect(deps.patchApplication).not.toHaveBeenCalled();
  });

  it("patches status for all selected", async () => {
    const { result, deps } = setup();
    act(() => result.current.openChangeStatusDialog("accepted"));

    await act(async () => {
      await result.current.confirmBulkChangeStatus();
    });

    expect(deps.patchApplication).toHaveBeenCalledTimes(2);
    expect(deps.patchApplication).toHaveBeenCalledWith("a", {
      status: "accepted",
      interviewAt: null,
      interviewDetails: null,
    });
    expect(deps.setSelectedJobIds).toHaveBeenCalledWith(new Set());
  });

  it("keeps failed ids after partial status change", async () => {
    const { result, deps } = setup({
      patchApplication: vi.fn(async (id: string) => id !== "a"),
    });
    act(() => result.current.openChangeStatusDialog("rejected"));

    await act(async () => {
      await result.current.confirmBulkChangeStatus();
    });

    expect(deps.setSelectedJobIds).toHaveBeenCalledWith(new Set(["a"]));
  });
});
