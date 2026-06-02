import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildApplicationsCsv,
  buildGroupsCsv,
  getExternalApplications,
  getExternalGroupDetail,
  getExternalGroups,
  getExternalUserDetail,
  getExternalUsers,
} from "@/lib/server/externalApi";
import { getCoachDashboard } from "@/lib/server/coach";
import { CoachDashboardData } from "@/types/coach";
import { ExternalApiActor } from "@/types/externalApi";

vi.mock("@/lib/server/coach", () => ({
  getCoachDashboard: vi.fn(),
}));

const actor: ExternalApiActor = {
  id: 11,
  email: "coach@example.com",
  firstName: "Jordi",
  lastName: "Brisbois",
  role: "coach",
};

const dashboardFixture: CoachDashboardData = {
  viewer: {
    id: 11,
    email: "coach@example.com",
    firstName: "Jordi",
    lastName: "Brisbois",
    role: "coach",
  },
  users: [
    {
      id: 21,
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Durand",
      role: "user",
      groupIds: [5],
      groupNames: ["Promo A"],
      applicationCount: 2,
      interviewCount: 1,
      dueCount: 1,
      acceptedCount: 0,
      rejectedCount: 0,
      inProgressCount: 2,
      latestActivityAt: "2026-03-18T10:00:00.000Z",
      lastSeenAt: "2026-03-18T09:00:00.000Z",
      lastCoachActionAt: null,
      trackingPhase: "job_search",
      hasAcceptedStage: false,
      hasAcceptedJob: false,
      applications: [],
    },
  ],
  groups: [
    {
      id: 5,
      name: "Promo A",
      createdAt: "2026-03-16T08:00:00.000Z",
      archivedAt: null,
      createdBy: {
        id: 1,
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
      },
      managerCoachId: 11,
      members: [
        {
          id: 21,
          email: "alice@example.com",
          firstName: "Alice",
          lastName: "Durand",
          role: "user",
          lastSeenAt: "2026-03-18T09:00:00.000Z",
        },
      ],
      coaches: [
        {
          id: 11,
          email: "coach@example.com",
          firstName: "Jordi",
          lastName: "Brisbois",
          role: "coach",
          lastSeenAt: "2026-03-18T09:30:00.000Z",
        },
        {
          id: 14,
          email: "alex@example.com",
          firstName: "Alex",
          lastName: "Martin",
          role: "coach",
          lastSeenAt: "2026-03-17T16:00:00.000Z",
        },
      ],
    },
  ],
  availableCoaches: [],
};

describe("externalApi", () => {
  const mockedGetCoachDashboard = vi.mocked(getCoachDashboard);

  beforeEach(() => {
    mockedGetCoachDashboard.mockResolvedValue(dashboardFixture);
  });

  it("serializes assigned coaches and manager in group exports", async () => {
    const response = await getExternalGroups(actor);

    expect(response.groups).toHaveLength(1);
    expect(response.groups[0]).toMatchObject({
      id: 5,
      createdBy: {
        id: 1,
        email: "admin@example.com",
      },
      managerCoachId: 11,
      coachCount: 2,
      manager: {
        id: 11,
        fullName: "Jordi Brisbois",
        isManager: true,
      },
      coaches: [
        {
          id: 11,
          fullName: "Jordi Brisbois",
          isManager: true,
        },
        {
          id: 14,
          fullName: "Alex Martin",
          isManager: false,
        },
      ],
    });
    expect(response.groups[0].createdBy).not.toHaveProperty("firstName");
    expect(response.groups[0].createdBy).not.toHaveProperty("lastName");
    expect(response.groups[0].members).toBeUndefined();
  });

  it("includes members only when includeApplications is requested", async () => {
    const response = await getExternalGroupDetail(actor, 5);

    expect(response).not.toBeNull();
    expect(response?.members).toEqual([
      expect.objectContaining({
        id: 21,
        fullName: "Alice Durand",
        applications: [],
      }),
    ]);
  });

  it("returns null when a scoped user is not visible in the dashboard", async () => {
    mockedGetCoachDashboard.mockResolvedValueOnce({
      ...dashboardFixture,
      users: [],
    });

    await expect(getExternalUserDetail(actor, 99)).resolves.toBeNull();
  });

  it("exports manager and assigned coaches in group csv", () => {
    const csv = buildGroupsCsv([
      {
        id: 5,
        name: "Promo A",
        createdAt: "2026-03-16T08:00:00.000Z",
        archivedAt: null,
        createdBy: {
          id: 1,
          email: "admin@example.com",
        },
        managerCoachId: 11,
        manager: {
          id: 11,
          email: "coach@example.com",
          firstName: "Jordi",
          lastName: "Brisbois",
          fullName: "Jordi Brisbois",
          role: "coach",
          isManager: true,
        },
        coachCount: 2,
        coaches: [
          {
            id: 11,
            email: "coach@example.com",
            firstName: "Jordi",
            lastName: "Brisbois",
            fullName: "Jordi Brisbois",
            role: "coach",
            isManager: true,
          },
          {
            id: 14,
            email: "alex@example.com",
            firstName: "Alex",
            lastName: "Martin",
            fullName: "Alex Martin",
            role: "coach",
            isManager: false,
          },
        ],
        memberCount: 1,
        totalApplications: 2,
        totalInterviews: 1,
      },
    ]);

    expect(csv).toContain("Manager");
    expect(csv).toContain("Nombre de coachs");
    expect(csv).toContain("Jordi Brisbois");
    expect(csv).toContain("Alex Martin");
  });

  it("filters users and applications by numeric groupId even when ids were serialized as strings upstream", async () => {
    mockedGetCoachDashboard.mockResolvedValueOnce({
      ...dashboardFixture,
      users: [
        {
          ...dashboardFixture.users[0],
          id: 21 as unknown as number,
          groupIds: ["5"] as unknown as number[],
        },
      ],
      groups: [
        {
          ...dashboardFixture.groups[0],
          id: "5" as unknown as number,
          createdBy: {
            id: "1" as unknown as number,
            email: "admin@example.com",
            firstName: "Admin",
            lastName: "User",
          },
          managerCoachId: "11" as unknown as number,
          members: [
            {
              ...dashboardFixture.groups[0].members[0],
              id: "21" as unknown as number,
            },
          ],
          coaches: [
            {
              ...dashboardFixture.groups[0].coaches[0],
              id: "11" as unknown as number,
            },
          ],
        },
      ],
    });

    const usersResponse = await getExternalUsers(actor, { groupId: 5 });
    const applicationsResponse = await getExternalApplications(actor, { groupId: 5 });

    expect(usersResponse.users).toHaveLength(1);
    expect(applicationsResponse.applications).toHaveLength(0);
  });

  it("exposes derived follow-up and interview flags on external application rows", async () => {
    mockedGetCoachDashboard.mockResolvedValueOnce({
      ...dashboardFixture,
      users: [
        {
          ...dashboardFixture.users[0],
          applications: [
            {
              job: {
                id: "job-1",
                title: "Dev Full Stack",
                company: "Forem",
                location: "Paris",
                contractType: "CDI",
                publicationDate: "2026-03-10T08:00:00.000Z",
                url: "https://example.com/jobs/1",
                description: "Description",
                source: "forem",
              },
              appliedAt: "2026-03-12T08:00:00.000Z",
              followUpDueAt: "2026-03-15T08:00:00.000Z",
              followUpEnabled: true,
              lastFollowUpAt: null,
              status: "in_progress",
              interviewAt: "2026-03-20T14:00:00.000Z",
              interviewDetails: "Visio",
              updatedAt: "2026-03-18T10:00:00.000Z",
            },
          ],
        },
      ],
    });

    const response = await getExternalApplications(actor);

    expect(response.applications).toHaveLength(1);
    expect(response.applications[0]).toMatchObject({
      isFollowUpDue: true,
      isInterviewScheduled: true,
      application: {
        status: "in_progress",
      },
    });
  });

  it("exports derived follow-up and interview columns in application csv", () => {
    const csv = buildApplicationsCsv([
      {
        applicationId: 1,
        userId: 21,
        userEmail: "alice@example.com",
        userFirstName: "Alice",
        userLastName: "Durand",
        userRole: "user",
        groupIds: [5],
        groupNames: ["Promo A"],
        isFollowUpDue: true,
        isInterviewScheduled: true,
        application: {
          job: {
            id: "job-1",
            title: "Dev Full Stack",
            company: "Forem",
            location: "Paris",
            contractType: "CDI",
            publicationDate: "2026-03-10T08:00:00.000Z",
            url: "https://example.com/jobs/1",
            description: "Description",
            source: "forem",
          },
          appliedAt: "2026-03-12T08:00:00.000Z",
          followUpDueAt: "2026-03-15T08:00:00.000Z",
          followUpEnabled: true,
          lastFollowUpAt: null,
          status: "in_progress",
          notes: null,
          proofs: null,
          interviewAt: "2026-03-20T14:00:00.000Z",
          interviewDetails: "Visio",
          updatedAt: "2026-03-18T10:00:00.000Z",
        },
      },
    ]);

    expect(csv).toContain("Entretien planifié");
    expect(csv).toContain("Relance due");
    expect(csv).toContain("yes");
  });
});
