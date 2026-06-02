import {
  ExternalApiActor,
  ExternalApiFilters,
  ExternalApiGroupSummary,
  ExternalApiGroupsResponse,
  ExternalApiUserDetail,
  ExternalApiUsersResponse,
} from "@/types/externalApi";
import { CoachUserSummary } from "@/types/coach";
import {
  buildStats,
  loadDashboard,
  matchesSearch,
  normalizeLimit,
  normalizeOffset,
  toExternalGroupCoachSummary,
  toExternalUserSummary,
} from "./core";

export async function getExternalUsers(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
): Promise<ExternalApiUsersResponse> {
  const dashboard = await loadDashboard(actor, {
    userId: filters.userId,
    groupId: filters.groupId,
    role: filters.role,
    search: filters.search,
  });
  const offset = normalizeOffset(filters.offset);
  const limit = normalizeLimit(filters.limit, 200);

  const serializedUsers = dashboard.users
    .slice(offset, offset + limit)
    .map((entry) => toExternalUserSummary(entry, Boolean(filters.includeApplications)));

  return {
    actor,
    stats: buildStats(dashboard.users),
    users: serializedUsers,
  };
}

export async function getExternalUserDetail(
  actor: ExternalApiActor,
  userId: number
): Promise<ExternalApiUserDetail | null> {
  const dashboard = await loadDashboard(actor, { userId });
  const user = dashboard.users.find((entry) => entry.id === userId);
  if (!user) return null;

  return toExternalUserSummary(user, true);
}

export async function getExternalGroups(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
): Promise<ExternalApiGroupsResponse> {
  const dashboard = await loadDashboard(actor, {
    groupId: filters.groupId,
  });
  const offset = normalizeOffset(filters.offset);
  const limit = normalizeLimit(filters.limit, 200);
  const usersById = new Map(dashboard.users.map((entry) => [entry.id, entry]));

  let groups: ExternalApiGroupSummary[] = dashboard.groups
    .filter((group) =>
      matchesSearch(
        [
          group.name,
          group.createdBy.email,
          ...group.coaches.flatMap((coach) => [
            coach.email,
            coach.firstName,
            coach.lastName,
            `${coach.firstName} ${coach.lastName}`.trim(),
          ]),
        ],
        filters.search
      )
    )
    .map((group) => {
      const members = group.members
        .map((member) => usersById.get(member.id))
        .filter((entry): entry is CoachUserSummary => Boolean(entry));
      const coaches = group.coaches.map((coach) =>
        toExternalGroupCoachSummary(coach, group.managerCoachId)
      );
      const manager = coaches.find((coach) => coach.isManager) ?? null;

      return {
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        archivedAt: group.archivedAt,
        createdBy: {
          id: group.createdBy.id,
          email: group.createdBy.email,
        },
        managerCoachId: group.managerCoachId,
        manager,
        coachCount: coaches.length,
        coaches,
        memberCount: members.length,
        totalApplications: members.reduce((sum, entry) => sum + entry.applicationCount, 0),
        totalInterviews: members.reduce((sum, entry) => sum + entry.interviewCount, 0),
        members: filters.includeApplications
          ? members.map((entry) => toExternalUserSummary(entry, true))
          : undefined,
      };
    });

  if (filters.groupId) {
    groups = groups.filter((group) => group.id === filters.groupId);
  }

  return {
    actor,
    stats: buildStats(dashboard.users),
    groups: groups.slice(offset, offset + limit),
  };
}

export async function getExternalGroupDetail(actor: ExternalApiActor, groupId: number) {
  const response = await getExternalGroups(actor, {
    groupId,
    includeApplications: true,
    limit: 1,
  });

  return response.groups[0] ?? null;
}
