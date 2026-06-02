import { getCurrentUser } from "@/lib/server/auth";
import { db, ensureDatabase } from "@/lib/server/db";
import { recordAuditEvent } from "@/lib/server/auditLog";
import {
  getManagedGroupIdsForCoach,
  markCoachAction,
  type CoachCapableUser,
} from "@/lib/server/coachGroups";
import { logServerEvent } from "@/lib/server/observability";
import { toNumericId } from "@/lib/server/common";
import { buildCoachApplicationSummary } from "@/features/coach/applicationSummary";
import { CoachGroupMember } from "@/types/coach";
import { AuthUser, UserRole } from "@/types/auth";
import {
  CoachDashboardData,
  CoachGroupSummary,
  CoachUserSummary,
} from "@/types/coach";
import { listCoachDashboardApplications } from "@/lib/server/coachApplications";
interface CoachDashboardFilters {
  userId?: number | null;
  groupId?: number | null;
  role?: UserRole | null;
  search?: string | null;
}

function canCoach(role: UserRole) {
  return role === "coach" || role === "admin";
}

function matchesDashboardSearch(
  haystack: Array<string | null | undefined>,
  search?: string | null
) {
  const normalized = search?.trim().toLowerCase();
  if (!normalized) return true;

  return haystack
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function toGroupParticipant(input: {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  last_seen_at?: string | null;
}) {
  return {
    id: input.id,
    email: input.email,
    firstName: input.first_name,
    lastName: input.last_name,
    role: input.role,
    lastSeenAt: input.last_seen_at ?? null,
  };
}

export async function requireCoachAccess(): Promise<CoachCapableUser | null> {
  const user = await getCurrentUser();
  if (!user || !canCoach(user.role)) {
    return null;
  }

  return user as CoachCapableUser;
}

export async function requireAdminAccess(): Promise<(AuthUser & { role: "admin" }) | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return null;
  }

  return user as AuthUser & { role: "admin" };
}

export async function getCoachDashboard(
  viewer: CoachCapableUser,
  filters: CoachDashboardFilters = {}
): Promise<CoachDashboardData> {
  await ensureDatabase();
  const [usersResult, groupsResult, membersResult, coachesResult, managedGroupIds] = await Promise.all([
    db.query<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: UserRole;
      tracking_phase: string;
      last_seen_at: string | null;
      last_coach_action_at: string | null;
    }>(
      `SELECT id,
              email,
              first_name,
              last_name,
              role,
              tracking_phase,
              last_seen_at,
              last_coach_action_at
       FROM users
       ORDER BY last_name ASC, first_name ASC, email ASC`
    ),
    db.query<{
      id: number;
      name: string;
      created_at: string;
      archived_at: string | null;
      created_by: number;
      created_by_email: string;
      created_by_first_name: string;
      created_by_last_name: string;
      manager_coach_user_id: number | null;
    }>(
      `SELECT coach_groups.id,
              coach_groups.name,
              coach_groups.created_at,
              coach_groups.archived_at,
              coach_groups.created_by,
              coach_groups.manager_coach_user_id,
              users.email AS created_by_email,
              users.first_name AS created_by_first_name,
              users.last_name AS created_by_last_name
       FROM coach_groups
       INNER JOIN users ON users.id = coach_groups.created_by
       ORDER BY coach_groups.name ASC, coach_groups.created_at DESC`
    ),
    db.query<{
      group_id: number;
      user_id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: UserRole;
    }>(
      `SELECT coach_group_members.group_id,
              users.id AS user_id,
              users.email,
              users.first_name,
              users.last_name,
              users.role
       FROM coach_group_members
       INNER JOIN users ON users.id = coach_group_members.user_id
       ORDER BY users.last_name ASC, users.first_name ASC, users.email ASC`
    ),
    db.query<{
      group_id: number;
      user_id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: UserRole;
      last_seen_at: string | null;
    }>(
      `SELECT coach_group_coaches.group_id,
              users.id AS user_id,
              users.email,
              users.first_name,
              users.last_name,
              users.role,
              users.last_seen_at
       FROM coach_group_coaches
       INNER JOIN users ON users.id = coach_group_coaches.user_id
       ORDER BY users.last_name ASC, users.first_name ASC, users.email ASC`
    ),
    viewer.role === "admin" ? Promise.resolve([]) : getManagedGroupIdsForCoach(viewer.id),
  ]);

  const visibleGroupIds =
    viewer.role === "admin"
      ? new Set(
          groupsResult.rows
            .map((row) => toNumericId(row.id))
            .filter((groupId): groupId is number => groupId !== null)
        )
      : new Set(managedGroupIds);

  const groupsById = new Map<number, CoachGroupSummary>();
  for (const row of groupsResult.rows) {
    const groupId = toNumericId(row.id);
    const createdById = toNumericId(row.created_by);
    const managerCoachId = toNumericId(row.manager_coach_user_id);
    if (groupId === null || createdById === null || !visibleGroupIds.has(groupId)) {
      continue;
    }

    groupsById.set(groupId, {
      id: groupId,
      name: row.name,
      createdAt: row.created_at,
      archivedAt: row.archived_at,
      createdBy: {
        id: createdById,
        email: row.created_by_email,
        firstName: row.created_by_first_name,
        lastName: row.created_by_last_name,
      },
      managerCoachId,
      members: [],
      coaches: [],
    });
  }

  const groupIdsByUser = new Map<number, number[]>();
  const groupNamesByUser = new Map<number, string[]>();
  for (const row of coachesResult.rows) {
    const groupId = toNumericId(row.group_id);
    const userId = toNumericId(row.user_id);
    if (groupId === null || userId === null) continue;

    const group = groupsById.get(groupId);
    if (!group) continue;

    group.coaches.push(
      toGroupParticipant({
        id: userId,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
        last_seen_at: row.last_seen_at,
      })
    );
  }

  for (const row of membersResult.rows) {
    const groupId = toNumericId(row.group_id);
    const userId = toNumericId(row.user_id);
    if (groupId === null || userId === null) continue;

    const group = groupsById.get(groupId);
    if (!group) continue;

    group.members.push(
      toGroupParticipant({
        id: userId,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
      })
    );

    groupIdsByUser.set(userId, [...(groupIdsByUser.get(userId) ?? []), groupId]);
    groupNamesByUser.set(userId, [...(groupNamesByUser.get(userId) ?? []), group.name]);
  }

  const scopedUserRows = usersResult.rows.filter((row) => {
    const userId = toNumericId(row.id);
    if (userId === null) return false;

    const groupIds = groupIdsByUser.get(userId) ?? [];
    const groupNames = groupNamesByUser.get(userId) ?? [];

    if (viewer.role !== "admin" && groupIds.length === 0) {
      return false;
    }

    if (filters.userId && userId !== filters.userId) return false;
    if (filters.groupId && !groupIds.includes(filters.groupId)) return false;
    if (filters.role && row.role !== filters.role) return false;

    return matchesDashboardSearch(
      [row.first_name, row.last_name, `${row.first_name} ${row.last_name}`.trim(), row.email, ...groupNames],
      filters.search
    );
  });

  const scopedUserIds = scopedUserRows
    .map((row) => toNumericId(row.id))
    .filter((userId): userId is number => userId !== null);
  const applicationsByUser = await listCoachDashboardApplications(scopedUserIds);

  const users: CoachUserSummary[] = scopedUserRows.map((row) => {
    const userId = toNumericId(row.id);
    if (userId === null) {
      throw new Error("Invalid user id in coach dashboard");
    }
    const applications = applicationsByUser.get(userId) ?? [];

    return {
      id: userId,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      trackingPhase: row.tracking_phase as CoachUserSummary["trackingPhase"],
      groupIds: groupIdsByUser.get(userId) ?? [],
      groupNames: groupNamesByUser.get(userId) ?? [],
      ...buildCoachApplicationSummary(applications),
      lastSeenAt: row.last_seen_at,
      lastCoachActionAt: row.last_coach_action_at,
      applications,
    };
  });

  return {
    viewer,
    users,
    groups: Array.from(groupsById.values()),
    availableCoaches: usersResult.rows
      .filter((row) => row.role === "coach")
      .map((row) => {
        const coachId = toNumericId(row.id);
        if (coachId === null) return null;
        return toGroupParticipant({
          id: coachId,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          role: row.role,
        });
      })
      .filter((row): row is CoachGroupMember => Boolean(row)),
  };
}

export async function setUserRole(userId: number, role: UserRole, actorId?: number) {
  await ensureDatabase();
  const previousResult = await db.query<{ role: UserRole }>(
    `SELECT role
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );
  const previousRole = previousResult.rows[0]?.role ?? null;
  if (!previousRole) {
    throw new Error("User not found");
  }

  await db.query(
    `UPDATE users
     SET role = $2
     WHERE id = $1`,
    [userId, role]
  );

  if (role !== "coach" && role !== "admin") {
    await db.query(
      `DELETE FROM coach_group_coaches
       WHERE user_id = $1`,
      [userId]
    );
    await db.query(
      `UPDATE coach_groups
       SET manager_coach_user_id = NULL
       WHERE manager_coach_user_id = $1`,
      [userId]
    );
  }

  if (actorId) {
    await markCoachAction(actorId);
    await recordAuditEvent({
      actorUserId: actorId,
      action: "admin_role_changed",
      targetUserId: userId,
      payload: { fromRole: previousRole, toRole: role },
    });
    logServerEvent({
      category: "admin",
      action: "role_changed",
      meta: { actorUserId: actorId, targetUserId: userId, fromRole: previousRole, toRole: role },
    });
  }
}

export {
  addCoachToGroup,
  assertCanAccessCoachUser,
  addUserToCoachGroup,
  canAccessCoachUser,
  canManageCoachAssignments,
  canManageCoachGroup,
  createCoachGroup,
  deleteCoachGroup,
  markCoachAction,
  removeCoachFromGroup,
  removeUserFromCoachGroup,
  setCoachGroupManager,
} from "@/lib/server/coachGroups";

export {
  type CoachImportDateFormat,
  type CoachImportedApplicationInput,
  deleteCoachManagedApplication,
  importCoachApplicationsForUser,
  updateCoachApplicationNotes,
  updateCoachManagedApplication,
} from "@/lib/server/coachApplications";
