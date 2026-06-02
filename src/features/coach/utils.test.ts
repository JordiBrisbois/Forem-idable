import { describe, expect, it } from "vitest";
import {
  buildCoachPrioritySections,
  buildCoachRecentActivity,
  isCoachUserInactive,
  isTrackedCoachBeneficiary,
} from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

function isStageContract(contractType: string): boolean {
  const normalized = contractType.toUpperCase().trim();
  return normalized.includes("STAGE") || normalized.includes("STAGIAIRE");
}

function deriveAcceptedFlags(applications: CoachUserSummary["applications"]) {
  let hasAcceptedStage = false;
  let hasAcceptedJob = false;
  for (const app of applications) {
    if (app.status === "accepted") {
      if (isStageContract(app.job.contractType)) {
        hasAcceptedStage = true;
      } else {
        hasAcceptedJob = true;
      }
    }
  }
  return { hasAcceptedStage, hasAcceptedJob };
}

function makeUser(overrides: Partial<CoachUserSummary>): CoachUserSummary {
  const applications = overrides.applications ?? [];
  const derived = deriveAcceptedFlags(applications);

  return {
    id: overrides.id ?? 1,
    email: overrides.email ?? "user@example.com",
    firstName: overrides.firstName ?? "Jane",
    lastName: overrides.lastName ?? "Doe",
    role: overrides.role ?? "user",
    trackingPhase: overrides.trackingPhase ?? "internship_search",
    groupIds: overrides.groupIds ?? [1],
    groupNames: overrides.groupNames ?? ["Groupe A"],
    applicationCount: overrides.applicationCount ?? 1,
    interviewCount: overrides.interviewCount ?? 0,
    dueCount: overrides.dueCount ?? 0,
    acceptedCount: overrides.acceptedCount ?? 0,
    rejectedCount: overrides.rejectedCount ?? 0,
    inProgressCount: overrides.inProgressCount ?? 1,
    latestActivityAt: overrides.latestActivityAt ?? "2026-03-01T09:00:00.000Z",
    lastSeenAt: overrides.lastSeenAt ?? null,
    lastCoachActionAt: overrides.lastCoachActionAt ?? null,
    hasAcceptedStage: overrides.hasAcceptedStage ?? derived.hasAcceptedStage,
    hasAcceptedJob: overrides.hasAcceptedJob ?? derived.hasAcceptedJob,
    applications,
  };
}

describe("buildCoachPrioritySections", () => {
  it("groups due follow-ups and upcoming interviews by beneficiary", () => {
    const users = [
      makeUser({
        id: 1,
        firstName: "Alice",
        dueCount: 2,
        interviewCount: 1,
        latestActivityAt: "2026-03-10T10:00:00.000Z",
        applications: [
          {
            job: {
              id: "job-1",
              title: "Dev",
              company: "Acme",
              location: "Bruxelles",
              contractType: "CDI",
              publicationDate: "2026-03-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-03-01T09:00:00.000Z",
            followUpDueAt: "2026-03-12T00:00:00.000Z",
            followUpEnabled: true,
            status: "follow_up",
            updatedAt: "2026-03-10T10:00:00.000Z",
            interviewAt: "2026-03-20T09:00:00.000Z",
          },
          {
            job: {
              id: "job-2",
              title: "UX",
              company: "Acme",
              location: "Namur",
              contractType: "CDD",
              publicationDate: "2026-03-05T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-03-05T09:00:00.000Z",
            followUpDueAt: "2026-03-14T00:00:00.000Z",
            followUpEnabled: true,
            status: "in_progress",
            updatedAt: "2026-03-11T10:00:00.000Z",
          },
        ],
      }),
    ];

    const sections = buildCoachPrioritySections(users, new Date("2026-03-18T12:00:00.000Z"));

    expect(sections[0].total).toBe(1);
    expect(sections[0].items[0]?.summary).toContain("2 relances");
    expect(sections[0].items[0]?.jobId).toBe("job-1");
    expect(sections[0].items[0]?.badgeLabel).toBe("Acme + 1");
    expect(sections[1].total).toBe(1);
    expect(sections[1].items[0]?.detail).toContain("20 mars 2026");
    expect(sections[1].items[0]?.jobId).toBe("job-1");
    expect(sections[1].items[0]?.badgeLabel).toBe("Acme");
  });

  it("shows computed phase badge as Sortie positive when a beneficiary with due items has an accepted job", () => {
    // Note: a second non-accepted application is required so the user still has
    // due items and appears in the "due" priority section (accepted apps are excluded from due count).
    const users = [
      makeUser({
        id: 10,
        firstName: "Diana",
        dueCount: 1,
        acceptedCount: 1,
        inProgressCount: 1,
        latestActivityAt: "2026-03-10T10:00:00.000Z",
        applications: [
          {
            job: {
              id: "job-10a",
              title: "Dev Senior",
              company: "Omega",
              location: "Anvers",
              contractType: "CDI",
              publicationDate: "2026-02-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-02-01T09:00:00.000Z",
            followUpDueAt: "2026-03-12T00:00:00.000Z",
            followUpEnabled: true,
            status: "accepted",
            updatedAt: "2026-03-10T10:00:00.000Z",
          },
          {
            job: {
              id: "job-10b",
              title: "Dev Junior",
              company: "Beta",
              location: "Anvers",
              contractType: "CDI",
              publicationDate: "2026-02-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-02-01T09:00:00.000Z",
            followUpDueAt: "2026-03-12T00:00:00.000Z",
            followUpEnabled: true,
            status: "follow_up",
            updatedAt: "2026-03-10T10:00:00.000Z",
          },
        ],
      }),
    ];

    const sections = buildCoachPrioritySections(users, new Date("2026-03-18T12:00:00.000Z"));

    expect(sections[0].total).toBe(1);
    expect(sections[0].items[0]?.computedPhaseLabel).toBe("Sortie positive");
    expect(sections[0].items[0]?.computedPhaseVariant).toBe("success");
  });

  it("excludes beneficiaries with an accepted stage from due section", () => {
    const users = [
      makeUser({
        id: 12,
        firstName: "Fabienne",
        dueCount: 1,
        acceptedCount: 1,
        inProgressCount: 1,
        latestActivityAt: "2026-03-10T10:00:00.000Z",
        applications: [
          {
            job: {
              id: "job-12",
              title: "Stage",
              company: "Alpha",
              location: "Bruxelles",
              contractType: "Stage",
              publicationDate: "2026-03-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-03-01T09:00:00.000Z",
            followUpDueAt: "2026-03-12T00:00:00.000Z",
            followUpEnabled: true,
            status: "accepted",
            updatedAt: "2026-03-10T10:00:00.000Z",
          },
        ],
      }),
    ];

    const sections = buildCoachPrioritySections(users, new Date("2026-03-18T12:00:00.000Z"));

    expect(sections[0].total).toBe(0);
  });

  it("shows default phase badge when no accepted application", () => {
    const users = [
      makeUser({
        id: 11,
        firstName: "Eve",
        dueCount: 1,
        acceptedCount: 0,
        inProgressCount: 1,
        latestActivityAt: "2026-03-10T10:00:00.000Z",
        applications: [
          {
            job: {
              id: "job-11",
              title: "Dev Junior",
              company: "Sigma",
              location: "Gand",
              contractType: "CDI",
              publicationDate: "2026-03-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-03-01T09:00:00.000Z",
            followUpDueAt: "2026-03-12T00:00:00.000Z",
            followUpEnabled: true,
            status: "follow_up",
            updatedAt: "2026-03-10T10:00:00.000Z",
          },
        ],
      }),
    ];

    const sections = buildCoachPrioritySections(users, new Date("2026-03-18T12:00:00.000Z"));

    expect(sections[0].total).toBe(1);
    expect(sections[0].items[0]?.computedPhaseLabel).toBe("Recherche stage");
    expect(sections[0].items[0]?.computedPhaseVariant).toBe("info");
  });

  it("excludes beneficiaries with accepted applications from inactive section", () => {
    const users = [
      makeUser({
        id: 5,
        firstName: "Fabienne",
        acceptedCount: 1,
        inProgressCount: 0,
        dueCount: 0,
        interviewCount: 0,
        latestActivityAt: "2026-02-01T09:00:00.000Z",
        applicationCount: 2,
        applications: [
          {
            job: {
              id: "job-5a",
              title: "Stage",
              company: "Alpha",
              location: "Bruxelles",
              contractType: "Stage",
              publicationDate: "2026-01-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-01-01T09:00:00.000Z",
            followUpDueAt: "2026-01-15T09:00:00.000Z",
            followUpEnabled: false,
            status: "accepted",
            updatedAt: "2026-02-01T09:00:00.000Z",
          },
        ],
      }),
    ];

    const sections = buildCoachPrioritySections(users, new Date("2026-03-18T12:00:00.000Z"));

    expect(sections[2].total).toBe(0);
  });

  it("excludes beneficiaries with only closed applications from inactive section", () => {
    const users = [
      makeUser({
        id: 6,
        firstName: "Gauthier",
        acceptedCount: 0,
        rejectedCount: 2,
        inProgressCount: 0,
        dueCount: 0,
        interviewCount: 0,
        latestActivityAt: "2026-02-01T09:00:00.000Z",
        applicationCount: 2,
        applications: [
          {
            job: {
              id: "job-6a",
              title: "Ops",
              company: "Beta",
              location: "Liege",
              contractType: "CDI",
              publicationDate: "2026-01-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-01-01T09:00:00.000Z",
            followUpDueAt: "2026-01-15T09:00:00.000Z",
            followUpEnabled: false,
            status: "rejected",
            updatedAt: "2026-02-01T09:00:00.000Z",
          },
        ],
      }),
    ];

    const sections = buildCoachPrioritySections(users, new Date("2026-03-18T12:00:00.000Z"));

    expect(sections[2].total).toBe(0);
  });

  it("includes inactive beneficiaries with active applications but no acceptances", () => {
    const users = [
      makeUser({
        id: 7,
        firstName: "Hugo",
        acceptedCount: 0,
        inProgressCount: 2,
        dueCount: 0,
        interviewCount: 0,
        latestActivityAt: "2026-02-20T09:00:00.000Z",
        applicationCount: 3,
        applications: [
          {
            job: {
              id: "job-7a",
              title: "Data",
              company: "Gamma",
              location: "Mons",
              contractType: "CDI",
              publicationDate: "2026-02-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-02-01T09:00:00.000Z",
            followUpDueAt: "2026-02-15T09:00:00.000Z",
            followUpEnabled: true,
            status: "in_progress",
            updatedAt: "2026-02-20T09:00:00.000Z",
          },
        ],
      }),
    ];

    const sections = buildCoachPrioritySections(users, new Date("2026-03-18T12:00:00.000Z"));

    expect(sections[2].total).toBe(1);
    expect(sections[2].items[0]?.summary).toContain("Inactif depuis");
  });
});

describe("coach activity helpers", () => {
  it("detects inactive beneficiaries after 14 days", () => {
    expect(
      isCoachUserInactive(
        makeUser({
          latestActivityAt: "2026-03-01T09:00:00.000Z",
          applicationCount: 2,
        }),
        new Date("2026-03-18T12:00:00.000Z")
      )
    ).toBe(true);
  });

  it("does not mark beneficiaries as inactive if they have an accepted application", () => {
    expect(
      isCoachUserInactive(
        makeUser({
          latestActivityAt: "2026-02-01T09:00:00.000Z",
          applicationCount: 2,
          acceptedCount: 1,
        }),
        new Date("2026-03-18T12:00:00.000Z")
      )
    ).toBe(false);
  });

  it("does not mark beneficiaries as inactive if they have no active applications", () => {
    expect(
      isCoachUserInactive(
        makeUser({
          latestActivityAt: "2026-02-01T09:00:00.000Z",
          applicationCount: 2,
          acceptedCount: 0,
          rejectedCount: 2,
          inProgressCount: 0,
          dueCount: 0,
          interviewCount: 0,
        }),
        new Date("2026-03-18T12:00:00.000Z")
      )
    ).toBe(false);
  });

  it("builds recent activity entries ordered from newest to oldest", () => {
    const items = buildCoachRecentActivity([
      makeUser({
        id: 3,
        firstName: "Carla",
        latestActivityAt: "2026-03-17T09:00:00.000Z",
        applications: [
          {
            job: {
              id: "job-4",
              title: "Data",
              company: "Gamma",
              location: "Mons",
              contractType: "CDI",
              publicationDate: "2026-03-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-03-01T09:00:00.000Z",
            followUpDueAt: "2026-03-08T09:00:00.000Z",
            followUpEnabled: true,
            status: "in_progress",
            updatedAt: "2026-03-17T09:00:00.000Z",
            interviewAt: "2026-03-18T08:00:00.000Z",
          },
        ],
      }),
    ]);

    expect(items[0]?.title).toBe("Data");
    expect(items[0]?.detail).toContain("entretien planifié");
    expect(items[0]?.jobId).toBe("job-4");
  });

  it("treats grouped admins like beneficiaries in coach activity and priorities", () => {
    const adminLearner = makeUser({
      id: 4,
      firstName: "Jordi",
      role: "admin",
      groupIds: [2],
      groupNames: ["Parcours Dev"],
      dueCount: 1,
      applicationCount: 1,
      latestActivityAt: "2026-03-16T09:00:00.000Z",
      applications: [
        {
          job: {
            id: "job-5",
            title: "Frontend",
            company: "Delta",
            location: "Charleroi",
            contractType: "CDD",
            publicationDate: "2026-03-10T00:00:00.000Z",
            url: "#",
            source: "forem",
          },
          appliedAt: "2026-03-10T09:00:00.000Z",
          followUpDueAt: "2026-03-15T09:00:00.000Z",
          followUpEnabled: true,
          status: "follow_up",
          updatedAt: "2026-03-16T09:00:00.000Z",
        },
      ],
    });

    expect(isTrackedCoachBeneficiary(adminLearner)).toBe(true);
    expect(buildCoachPrioritySections([adminLearner], new Date("2026-03-18T12:00:00.000Z"))[0].total).toBe(1);
    expect(buildCoachRecentActivity([adminLearner])[0]?.userName).toContain("Jordi");
  });
});