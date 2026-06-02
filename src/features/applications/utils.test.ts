import { describe, expect, it } from "vitest";
import {
  applicationStatusLabel,
  countClosedApplications,
  countUpcomingInterviews,
  filterApplications,
  formatApplicationDate,
  formatApplicationDateTime,
  getApplicationsDueSummary,
  getDisplayApplicationStatus,
  isApplicationFollowUpDue,
  isFollowUpEnabled,
  isFollowUpPending,
  isManualApplication,
  shouldShowFollowUpDetails,
  sortApplicationsByMostRecent,
} from "@/features/applications/utils";
import { JobApplication } from "@/types/application";

function buildApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    job: {
      id: "job-1",
      title: "Développeur",
      company: "ACME",
      location: "Liège",
      contractType: "CDI",
      publicationDate: "2026-03-01T10:00:00.000Z",
      url: "https://example.com/job-1",
      source: "forem",
    },
    sourceType: "tracked",
    appliedAt: "2026-03-10T09:00:00.000Z",
    followUpDueAt: "2026-03-17T09:00:00.000Z",
    status: "in_progress",
    updatedAt: "2026-03-10T09:00:00.000Z",
    ...overrides,
  };
}

describe("applications utils", () => {
  it("sorts applications by most recent relevant date", () => {
    const recent = buildApplication({
      job: { ...buildApplication().job, id: "job-2" },
      appliedAt: "2026-03-12T09:00:00.000Z",
      updatedAt: "2026-03-12T09:00:00.000Z",
    });
    const old = buildApplication();
    const fallbackToPublicationDate = buildApplication({
      job: {
        ...buildApplication().job,
        id: "job-3",
        publicationDate: "2026-03-11T08:00:00.000Z",
      },
      appliedAt: "",
      updatedAt: "",
    });

    expect(sortApplicationsByMostRecent([old, fallbackToPublicationDate, recent]).map((entry) => entry.job.id)).toEqual([
      "job-2",
      "job-3",
      "job-1",
    ]);
  });

  it("uses updatedAt to break ties when appliedAt is the same", () => {
    const firstCreated = buildApplication({
      job: { ...buildApplication().job, id: "job-older" },
      appliedAt: "2026-03-12",
      updatedAt: "2026-03-12T08:00:00.000Z",
    });
    const laterCreated = buildApplication({
      job: { ...buildApplication().job, id: "job-newer" },
      appliedAt: "2026-03-12",
      updatedAt: "2026-03-12T10:00:00.000Z",
    });

    expect(sortApplicationsByMostRecent([firstCreated, laterCreated]).map((entry) => entry.job.id)).toEqual([
      "job-newer",
      "job-older",
    ]);
  });

  it("flags follow-up details only for actionable statuses", () => {
    expect(isFollowUpPending("in_progress")).toBe(true);
    expect(isFollowUpPending("follow_up")).toBe(true);
    expect(isFollowUpPending("accepted")).toBe(false);

    expect(shouldShowFollowUpDetails("in_progress")).toBe(true);
    expect(shouldShowFollowUpDetails("follow_up")).toBe(true);
    expect(shouldShowFollowUpDetails("interview")).toBe(false);
    expect(shouldShowFollowUpDetails("accepted")).toBe(false);
    expect(shouldShowFollowUpDetails("rejected")).toBe(false);

    expect(isFollowUpEnabled(buildApplication())).toBe(true);
    expect(isFollowUpEnabled(buildApplication({ followUpEnabled: false }))).toBe(false);
    expect(isApplicationFollowUpDue(buildApplication())).toBe(true);
    expect(getDisplayApplicationStatus(buildApplication())).toBe("follow_up");
    expect(
      isApplicationFollowUpDue(
        buildApplication({
          followUpDueAt: "2026-03-01T09:00:00.000Z",
        })
      )
    ).toBe(true);
    expect(
      isApplicationFollowUpDue(
        buildApplication({
          followUpDueAt: "2026-03-01T09:00:00.000Z",
          followUpEnabled: false,
        })
      )
    ).toBe(false);
    expect(
      getDisplayApplicationStatus(
        buildApplication({
          followUpEnabled: false,
        })
      )
    ).toBe("in_progress");
  });

  it("detects manual applications and formats values safely", () => {
    expect(isManualApplication(buildApplication({ sourceType: "manual" }))).toBe(true);
    expect(
      isManualApplication(
        buildApplication({
          sourceType: undefined,
          job: { ...buildApplication().job, id: "manual-123" },
        })
      )
    ).toBe(true);
    expect(isManualApplication(buildApplication())).toBe(false);

    expect(applicationStatusLabel("interview")).toBe("Entretien");
    expect(formatApplicationDate("invalid")).toBe("N/A");
    expect(formatApplicationDateTime(undefined)).toBe("N/A");
  });

  it("summarizes due applications and counts derived states", () => {
    const apps = [
      buildApplication({
        job: { ...buildApplication().job, id: "job-1", company: "Acme" },
        interviewAt: "2026-03-25T09:00:00.000Z",
      }),
      buildApplication({
        job: { ...buildApplication().job, id: "job-2", company: "Beta" },
        status: "accepted",
        interviewAt: "2026-03-18T09:00:00.000Z",
      }),
      buildApplication({
        job: { ...buildApplication().job, id: "job-3", company: "Gamma" },
        status: "rejected",
      }),
      buildApplication({
        job: { ...buildApplication().job, id: "job-4", company: "Delta" },
      }),
    ];

    expect(getApplicationsDueSummary(apps)).toBe("Acme, Delta");
    expect(countUpcomingInterviews(apps, new Date("2026-03-20T00:00:00.000Z"))).toBe(1);
    expect(countClosedApplications(apps)).toBe(2);
  });

  it("filters applications by mode and search", () => {
    const apps = [
      buildApplication({
        job: {
          ...buildApplication().job,
          id: "manual-1",
          company: "Acme",
          title: "Développeur React",
          url: "#",
        },
        sourceType: "manual",
      }),
      buildApplication({
        job: {
          ...buildApplication().job,
          id: "job-2",
          company: "Beta",
          title: "Analyste",
          url: "https://example.com/job-2",
        },
        interviewAt: "2026-03-25T09:00:00.000Z",
      }),
      buildApplication({
        job: {
          ...buildApplication().job,
          id: "job-3",
          company: "Gamma",
          title: "Coach",
          url: "https://example.com/job-3",
        },
      }),
    ];

    expect(
      filterApplications(apps, {
        search: "react",
        modeFilter: "all",
        hasUnreadCoachUpdate: () => false,
      }).map((entry) => entry.job.id)
    ).toEqual(["manual-1"]);

    expect(
      filterApplications(apps, {
        search: "",
        modeFilter: "manual",
        hasUnreadCoachUpdate: () => false,
      }).map((entry) => entry.job.id)
    ).toEqual(["manual-1"]);

    expect(
      filterApplications(apps, {
        search: "",
        modeFilter: "interviews",
        hasUnreadCoachUpdate: () => false,
      }).map((entry) => entry.job.id)
    ).toEqual(["job-2"]);

    expect(
      filterApplications(apps, {
        search: "",
        modeFilter: "coach_updates",
        hasUnreadCoachUpdate: (application) => application.job.id === "job-3",
      }).map((entry) => entry.job.id)
    ).toEqual(["job-3"]);
  });
});
