import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCoachUtilities } from "@/features/coach/useCoachUtilities";

const { mockExportCoachApplicationsToCSV, mockRequestCalendarSubscriptionApi } = vi.hoisted(() => ({
  mockExportCoachApplicationsToCSV: vi.fn(),
  mockRequestCalendarSubscriptionApi: vi.fn(),
}));

vi.mock("@/lib/exportCoachApplicationsCsv", () => ({
  exportCoachApplicationsToCSV: mockExportCoachApplicationsToCSV,
}));

vi.mock("@/features/coach/coachDashboardApi", () => ({
  requestCalendarSubscription: mockRequestCalendarSubscriptionApi,
}));

describe("useCoachUtilities", () => {
  beforeEach(() => {
    mockExportCoachApplicationsToCSV.mockReset();
    mockRequestCalendarSubscriptionApi.mockReset();
  });

  it("exports the selected user's applications with a stable filename", () => {
    const setFeedback = vi.fn();
    const setCalendarRegenerationTarget = vi.fn();

    const { result } = renderHook(() =>
      useCoachUtilities({
        calendarRegenerationTarget: null,
        selectedUser: {
          id: 7,
          email: "Jean.Dupont@example.test",
          firstName: "Jean",
          lastName: "Dupont",
          role: "user",
          groupIds: [],
          groupNames: [],
          applicationCount: 1,
          interviewCount: 0,
          dueCount: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          inProgressCount: 1,
          latestActivityAt: "2026-03-25T10:00:00.000Z",
          lastSeenAt: null,
          lastCoachActionAt: null,
          trackingPhase: "job_search",
          hasAcceptedStage: false,
          hasAcceptedJob: false,
          applications: [
            {
              job: {
                id: "job-1",
                title: "Dev",
                location: "Liege",
                contractType: "CDI",
                publicationDate: "2026-03-25T10:00:00.000Z",
                url: "https://example.test/job-1",
                source: "forem",
              },
              status: "in_progress",
              appliedAt: "2026-03-25T10:00:00.000Z",
              followUpDueAt: "2026-04-01T10:00:00.000Z",
              updatedAt: "2026-03-25T10:00:00.000Z",
            },
          ],
        },
        setCalendarRegenerationTarget,
        setFeedback,
      })
    );

    result.current.exportUserApplications();

    expect(mockExportCoachApplicationsToCSV).toHaveBeenCalledTimes(1);
    expect(mockExportCoachApplicationsToCSV.mock.calls[0]?.[0]).toMatchObject({
      filenamePrefix: "candidatures-jean-dupont-example-test",
    });
    expect(setFeedback).not.toHaveBeenCalled();
  });
});
