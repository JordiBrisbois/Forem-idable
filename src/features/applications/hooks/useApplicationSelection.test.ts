import { act, renderHook } from "@testing-library/react";
import { useApplicationSelection } from "@/features/applications/hooks/useApplicationSelection";
import { JobApplication } from "@/types/application";

function buildApp(id: string): JobApplication {
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
    status: "in_progress",
    updatedAt: "2026-03-01T10:00:00.000Z",
  };
}

describe("useApplicationSelection", () => {
  const visible = [buildApp("a"), buildApp("b")];
  const all = [...visible, buildApp("c")];

  it("starts with empty selection", () => {
    const { result } = renderHook(() =>
      useApplicationSelection({ visibleApplications: visible, allApplications: all })
    );
    expect(result.current.selectedJobIds.size).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
  });

  it("toggles a selection on", () => {
    const { result } = renderHook(() =>
      useApplicationSelection({ visibleApplications: visible, allApplications: all })
    );
    act(() => result.current.toggleSelection("a"));
    expect(result.current.selectedJobIds.has("a")).toBe(true);
  });

  it("toggles a selection off", () => {
    const { result } = renderHook(() =>
      useApplicationSelection({ visibleApplications: visible, allApplications: all })
    );
    act(() => result.current.toggleSelection("a"));
    act(() => result.current.toggleSelection("a"));
    expect(result.current.selectedJobIds.has("a")).toBe(false);
  });

  it("selects all visible applications", () => {
    const { result } = renderHook(() =>
      useApplicationSelection({ visibleApplications: visible, allApplications: all })
    );
    act(() => result.current.toggleSelectAll());
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.selectedJobIds.has("a")).toBe(true);
    expect(result.current.selectedJobIds.has("b")).toBe(true);
    expect(result.current.selectedJobIds.has("c")).toBe(false);
  });

  it("deselects all when already all selected", () => {
    const { result } = renderHook(() =>
      useApplicationSelection({ visibleApplications: visible, allApplications: all })
    );
    act(() => result.current.toggleSelectAll());
    act(() => result.current.toggleSelectAll());
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.selectedJobIds.size).toBe(0);
  });

  it("clears selection", () => {
    const { result } = renderHook(() =>
      useApplicationSelection({ visibleApplications: visible, allApplications: all })
    );
    act(() => result.current.toggleSelection("a"));
    act(() => result.current.clearSelection());
    expect(result.current.selectedJobIds.size).toBe(0);
  });

  it("counts selected follow-ups correctly", () => {
    const apps = [
      { ...buildApp("a"), followUpEnabled: true, status: "in_progress" as const },
      { ...buildApp("b"), followUpEnabled: false, status: "in_progress" as const },
      { ...buildApp("c"), followUpEnabled: true, status: "accepted" as const },
    ];
    const { result } = renderHook(() =>
      useApplicationSelection({ visibleApplications: apps, allApplications: apps })
    );
    act(() => result.current.toggleSelection("a"));
    act(() => result.current.toggleSelection("b"));
    expect(result.current.selectedFollowUpCount).toBe(1);
    expect(result.current.selectedFollowUpDisabledCount).toBe(1);
  });
});
