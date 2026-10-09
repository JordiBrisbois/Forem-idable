import { describe, expect, it } from "vitest";
import { updateUserStageInDashboard } from "@/features/coach/dashboardState";
import { CoachDashboardData } from "@/types/coach";

function makeDashboard(overrides: Partial<CoachDashboardData> = {}): CoachDashboardData {
  return {
    viewer: {
      id: 1,
      email: "coach@example.com",
      firstName: "Coach",
      lastName: "User",
      role: "coach",
    },
    users: [
      {
        id: 1,
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Durand",
        role: "user",
        searchGoal: "internship",
        beneficiaryStage: "internship_search",
        groupIds: [1],
        groupNames: ["Groupe A"],
        applicationCount: 2,
        interviewCount: 0,
        dueCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        inProgressCount: 2,
        latestActivityAt: "2026-04-01T10:00:00.000Z",
        lastSeenAt: null,
        lastCoachActionAt: null,
        hasAcceptedStage: false,
        hasAcceptedJob: false,
        applications: [],
      },
      {
        id: 2,
        email: "bob@example.com",
        firstName: "Bob",
        lastName: "Martin",
        role: "user",
        searchGoal: "job",
        beneficiaryStage: "job_search",
        groupIds: [1],
        groupNames: ["Groupe A"],
        applicationCount: 1,
        interviewCount: 0,
        dueCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        inProgressCount: 1,
        latestActivityAt: "2026-04-01T10:00:00.000Z",
        lastSeenAt: null,
        lastCoachActionAt: null,
        hasAcceptedStage: false,
        hasAcceptedJob: false,
        applications: [],
      },
    ],
    groups: [
      {
        id: 1,
        name: "Groupe A",
        createdAt: "2026-01-01T00:00:00.000Z",
        archivedAt: null,
        createdBy: { id: 1, email: "coach@example.com", firstName: "Coach", lastName: "User" },
        managerCoachId: 1,
        members: [
          { id: 1, email: "alice@example.com", firstName: "Alice", lastName: "Durand", role: "user", lastSeenAt: "2026-01-01T00:00:00.000Z" },
          { id: 2, email: "bob@example.com", firstName: "Bob", lastName: "Martin", role: "user", lastSeenAt: "2026-01-01T00:00:00.000Z" },
        ],
        coaches: [],
      },
    ],
    availableCoaches: [],
    ...overrides,
  };
}

describe("updateUserStageInDashboard", () => {
  it("updates the beneficiary stage (and derived goal) in users and group members", () => {
    const dashboard = makeDashboard();
    const next = updateUserStageInDashboard(dashboard, 1, "internship_ongoing");

    expect(next.users[0]?.beneficiaryStage).toBe("internship_ongoing");
    expect(next.users[0]?.searchGoal).toBe("internship");
    expect(next.users[1]?.beneficiaryStage).toBe("job_search"); // Bob unchanged

    const updatedGroupMember = next.groups[0]?.members.find((m) => m.id === 1);
    expect(updatedGroupMember).toBeDefined();
  });

  it("does not mutate the original dashboard", () => {
    const dashboard = makeDashboard();
    const next = updateUserStageInDashboard(dashboard, 1, "job_search");

    expect(dashboard.users[0]?.beneficiaryStage).toBe("internship_search");
    expect(next.users[0]?.beneficiaryStage).toBe("job_search");
    expect(next.users[0]?.searchGoal).toBe("job");
  });
});
