import { createHash, randomBytes } from "crypto";
import { runtimeConfig } from "@/config/runtime";
import { buildCalendarIcsFeed } from "@/lib/calendarIcs";
import { db, ensureDatabase } from "@/lib/server/db";
import { listApplicationRecordsFromRelationalStoreByUsers } from "@/lib/server/applicationStore";
import { UserRole } from "@/types/auth";
import { CalendarFeedApplicationRow, CalendarSubscriptionScope, CalendarSubscriptionSummary } from "@/types/calendar";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildCalendarToken() {
  const raw = randomBytes(24).toString("base64url");
  const plainTextToken = `frmcal_${raw}`;
  return {
    plainTextToken,
    tokenHash: hashToken(plainTextToken),
    keyPrefix: plainTextToken.slice(0, 12),
    lastFour: plainTextToken.slice(-4),
  };
}

function buildSubscriptionPath(token: string) {
  return `/api/calendar/subscriptions/${encodeURIComponent(token)}`;
}

async function getGroupById(groupId: number) {
  const result = await db.query<{ id: number; name: string }>(
    `SELECT id, name
     FROM coach_groups
     WHERE id = $1
     LIMIT 1`,
    [groupId]
  );

  return result.rows[0] ?? null;
}

async function resolveSubscriptionTarget(input: {
  scope: CalendarSubscriptionScope;
  groupId?: number | null;
}) {
  const groupId = input.scope === "group" ? input.groupId ?? null : null;

  if (input.scope !== "group") {
    return {
      groupId: null,
      groupName: null,
    };
  }

  if (!groupId || groupId <= 0) {
    throw new Error("Invalid group");
  }

  const group = await getGroupById(groupId);
  if (!group) {
    throw new Error("Group not found");
  }

  return {
    groupId,
    groupName: group.name,
  };
}

async function createSubscription(input: {
  scope: CalendarSubscriptionScope;
  groupId: number | null;
  createdBy: number;
}) {
  const { plainTextToken, tokenHash, keyPrefix, lastFour } = buildCalendarToken();

  const result = await db.query<{
    key_prefix: string;
    last_four: string;
    created_at: string;
    last_used_at: string | null;
    group_id: number | null;
  }>(
    `INSERT INTO calendar_subscriptions (scope, group_id, token_hash, key_prefix, last_four, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING key_prefix,
               last_four,
               created_at,
               last_used_at,
               group_id`,
    [input.scope, input.groupId, tokenHash, keyPrefix, lastFour, input.createdBy]
  );

  return {
    plainTextToken,
    row: result.rows[0],
  };
}

function toSubscriptionSummary(input: {
  scope: CalendarSubscriptionScope;
  groupId: number | null;
  groupName: string | null;
  keyPrefix: string;
  lastFour: string;
  createdAt: string;
  lastUsedAt: string | null;
  token: string;
}): CalendarSubscriptionSummary {
  return {
    scope: input.scope,
    groupId: input.groupId,
    groupName: input.groupName,
    keyPrefix: input.keyPrefix,
    lastFour: input.lastFour,
    createdAt: input.createdAt,
    lastUsedAt: input.lastUsedAt,
    path: buildSubscriptionPath(input.token),
  };
}

export async function createCalendarSubscription(input: {
  scope: CalendarSubscriptionScope;
  groupId?: number | null;
  actorId: number;
}): Promise<CalendarSubscriptionSummary> {
  await ensureDatabase();
  const target = await resolveSubscriptionTarget(input);

  const created = await createSubscription({
    scope: input.scope,
    groupId: target.groupId,
    createdBy: input.actorId,
  });

  return toSubscriptionSummary({
    scope: input.scope,
    groupId: target.groupId,
    groupName: target.groupName,
    keyPrefix: created.row.key_prefix,
    lastFour: created.row.last_four,
    createdAt: created.row.created_at,
    lastUsedAt: created.row.last_used_at,
    token: created.plainTextToken,
  });
}

export async function regenerateCalendarSubscription(input: {
  scope: CalendarSubscriptionScope;
  groupId?: number | null;
  actorId: number;
}) {
  await ensureDatabase();
  const target = await resolveSubscriptionTarget(input);

  await db.query(
    `UPDATE calendar_subscriptions
     SET revoked_at = NOW()
     WHERE scope = $1
       AND group_id IS NOT DISTINCT FROM $2
       AND revoked_at IS NULL`,
    [input.scope, target.groupId]
  );

  const created = await createSubscription({
    scope: input.scope,
    groupId: target.groupId,
    createdBy: input.actorId,
  });

  return toSubscriptionSummary({
    scope: input.scope,
    groupId: target.groupId,
    groupName: target.groupName,
    keyPrefix: created.row.key_prefix,
    lastFour: created.row.last_four,
    createdAt: created.row.created_at,
    lastUsedAt: created.row.last_used_at,
    token: created.plainTextToken,
  });
}

export async function resolveCalendarSubscription(token: string) {
  await ensureDatabase();
  const result = await db.query<{
    id: number;
    scope: CalendarSubscriptionScope;
    group_id: number | null;
    group_name: string | null;
    created_by: number;
  }>(
    `SELECT calendar_subscriptions.id,
            calendar_subscriptions.scope,
            calendar_subscriptions.group_id,
            calendar_subscriptions.created_by,
            coach_groups.name AS group_name
     FROM calendar_subscriptions
     LEFT JOIN coach_groups ON coach_groups.id = calendar_subscriptions.group_id
     WHERE calendar_subscriptions.token_hash = $1
       AND calendar_subscriptions.revoked_at IS NULL
     LIMIT 1`,
    [hashToken(token)]
  );

  return result.rows[0] ?? null;
}

export async function touchCalendarSubscriptionUsage(subscriptionId: number) {
  await ensureDatabase();
  await db.query(
    `UPDATE calendar_subscriptions
     SET last_used_at = NOW()
     WHERE id = $1`,
    [subscriptionId]
  );
}

async function listApplicationsForUsers(userIds: number[]) {
  if (userIds.length === 0) return [];
  const records = await listApplicationRecordsFromRelationalStoreByUsers(userIds);
  return records.map((record) => ({
    user_id: record.userId,
    application: record.application,
  }));
}

function buildCalendarFeedRows(input: {
  applications: Array<{ user_id: number; application: CalendarFeedApplicationRow["application"] }>;
  membersById: Map<number, Omit<CalendarFeedApplicationRow, "application">>;
}) {
  return input.applications
    .map((row) => {
      const member = input.membersById.get(row.user_id);
      if (!member) return null;
      return {
        ...member,
        application: row.application,
      };
    })
    .filter((entry): entry is CalendarFeedApplicationRow => Boolean(entry));
}

export async function listCalendarFeedRowsForGroup(groupId: number): Promise<{
  calendarName: string;
  rows: CalendarFeedApplicationRow[];
}> {
  await ensureDatabase();
  const target = await resolveSubscriptionTarget({ scope: "group", groupId });

  const membersResult = await db.query<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  }>(
    `SELECT users.id, users.email, users.first_name, users.last_name
     FROM coach_group_members
     INNER JOIN users ON users.id = coach_group_members.user_id
     WHERE coach_group_members.group_id = $1
     ORDER BY users.last_name ASC, users.first_name ASC, users.email ASC`,
    [groupId]
  );

  const memberIds = membersResult.rows.map((row) => row.id);
  const applications = await listApplicationsForUsers(memberIds);
  const membersById = new Map(
    membersResult.rows.map((row) => [
      row.id,
      {
        userId: row.id,
        userEmail: row.email,
        userFirstName: row.first_name,
        userLastName: row.last_name,
        groupNames: target.groupName ? [target.groupName] : [],
      },
    ] as const)
  );

  const rows = buildCalendarFeedRows({
    applications,
    membersById,
  });

  return {
    calendarName: `${runtimeConfig.app.name} - Groupe ${target.groupName}`,
    rows,
  };
}

async function resolveCalendarActorScope(actorId: number) {
  const actorResult = await db.query<{ role: UserRole }>(
    `SELECT role
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [actorId]
  );

  const role = actorResult.rows[0]?.role;
  if (!role) {
    throw new Error("Actor not found");
  }

  if (role === "admin") {
    return {
      role,
      managedGroupIds: null,
    };
  }

  const groupsResult = await db.query<{ group_id: number }>(
    `SELECT group_id
     FROM coach_group_coaches
     WHERE user_id = $1`,
    [actorId]
  );

  return {
    role,
    managedGroupIds: groupsResult.rows.map((row) => row.group_id),
  };
}

export async function listCalendarFeedRowsForAllGroups(actorId: number): Promise<{
  calendarName: string;
  rows: CalendarFeedApplicationRow[];
}> {
  await ensureDatabase();
  const actorScope = await resolveCalendarActorScope(actorId);
  if (actorScope.managedGroupIds && actorScope.managedGroupIds.length === 0) {
    return {
      calendarName: `${runtimeConfig.app.name} - Mes groupes beneficiaires`,
      rows: [],
    };
  }

  const membersResult = await db.query<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    group_names: string[];
  }>(
    `SELECT users.id,
            users.email,
            users.first_name,
            users.last_name,
            ARRAY_AGG(DISTINCT coach_groups.name ORDER BY coach_groups.name) AS group_names
     FROM users
     INNER JOIN coach_group_members ON coach_group_members.user_id = users.id
     INNER JOIN coach_groups ON coach_groups.id = coach_group_members.group_id
     WHERE ($1::bigint[] IS NULL OR coach_group_members.group_id = ANY($1::bigint[]))
     GROUP BY users.id, users.email, users.first_name, users.last_name
     ORDER BY users.last_name ASC, users.first_name ASC, users.email ASC`,
    [actorScope.managedGroupIds]
  );

  const memberIds = membersResult.rows.map((row) => row.id);
  const applications = await listApplicationsForUsers(memberIds);
  const membersById = new Map(
    membersResult.rows.map((row) => [
      row.id,
      {
        userId: row.id,
        userEmail: row.email,
        userFirstName: row.first_name,
        userLastName: row.last_name,
        groupNames: row.group_names,
      },
    ] as const)
  );

  const rows = buildCalendarFeedRows({
    applications,
    membersById,
  });

  return {
    calendarName:
      actorScope.role === "admin"
        ? `${runtimeConfig.app.name} - Tous les groupes beneficiaires`
        : `${runtimeConfig.app.name} - Mes groupes beneficiaires`,
    rows,
  };
}

export async function buildCalendarSubscriptionIcs(token: string) {
  const subscription = await resolveCalendarSubscription(token);
  if (!subscription) return null;

  const feed =
    subscription.scope === "group" && subscription.group_id
      ? await listCalendarFeedRowsForGroup(subscription.group_id)
      : await listCalendarFeedRowsForAllGroups(subscription.created_by);

  await touchCalendarSubscriptionUsage(subscription.id);

  return {
    calendarName: feed.calendarName,
    content: buildCalendarIcsFeed(feed),
  };
}
