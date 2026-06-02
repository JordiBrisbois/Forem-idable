import { renderHook } from "@testing-library/react";
import { useApplicationDerivedState } from "@/features/applications/hooks/useApplicationDerivedState";
import { JobApplication } from "@/types/application";

function buildApplication(
  overrides: Partial<JobApplication> = {}
): JobApplication {
  return {
    job: {
      id: "job-1",
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
    ...overrides,
  };
}

describe("useApplicationDerivedState", () => {
  const now = new Date("2026-03-10T12:00:00.000Z");

  it("returns correct state for a normal in-progress application", () => {
    const app = buildApplication();
    const { result } = renderHook(() => useApplicationDerivedState(app, now));

    expect(result.current.displayStatus).toBe("in_progress");
    expect(result.current.hasInterview).toBe(false);
    expect(result.current.followUpEnabled).toBe(true);
    expect(result.current.isDue).toBe(false);
    expect(result.current.isSoon).toBe(false);
  });

  it("detects a due follow-up", () => {
    const app = buildApplication({
      followUpDueAt: "2026-03-05T10:00:00.000Z",
    });
    const { result } = renderHook(() => useApplicationDerivedState(app, now));

    expect(result.current.isDue).toBe(true);
    expect(result.current.isSoon).toBe(false);
  });

  it("detects a soon follow-up (within 2 days)", () => {
    const app = buildApplication({
      followUpDueAt: "2026-03-11T10:00:00.000Z",
    });
    const { result } = renderHook(() => useApplicationDerivedState(app, now));

    expect(result.current.isDue).toBe(false);
    expect(result.current.isSoon).toBe(true);
  });

  it("detects an interview", () => {
    const app = buildApplication({
      interviewAt: "2026-03-20T14:00:00.000Z",
    });
    const { result } = renderHook(() => useApplicationDerivedState(app, now));

    expect(result.current.hasInterview).toBe(true);
  });

  it("returns follow_up as display status when due", () => {
    const app = buildApplication({
      status: "follow_up",
      followUpDueAt: "2026-03-05T10:00:00.000Z",
    });
    const { result } = renderHook(() => useApplicationDerivedState(app, now));

    expect(result.current.displayStatus).toBe("follow_up");
    expect(result.current.isDue).toBe(true);
  });

  it("is not due when follow-up is disabled", () => {
    const app = buildApplication({
      followUpDueAt: "2026-03-05T10:00:00.000Z",
      followUpEnabled: false,
    });
    const { result } = renderHook(() => useApplicationDerivedState(app, now));

    expect(result.current.isDue).toBe(false);
  });
});
