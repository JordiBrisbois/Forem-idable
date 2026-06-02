import { AuthUser, UserRole } from "@/types/auth";
import {
  ConversationParticipantSummary,
  ConversationPreview,
} from "@/types/messaging";
import {
  ConversationSummaryRow,
  MessageRow,
  ParticipantRow,
  Queryable,
} from "@/lib/server/messaging.types";
import {
  normalizeConversationPreview,
  toConversationMessage,
  toNumericId,
} from "@/lib/server/messaging.shared";

export async function listAccessibleGroupIds(queryable: Queryable, actor: AuthUser) {
  if (actor.role === "admin") {
    const result = await queryable.query<{ id: number }>(
      `SELECT id
       FROM coach_groups`
    );

    return result.rows
      .map((row) => toNumericId(row.id))
      .filter((groupId): groupId is number => groupId !== null);
  }

  const result = await queryable.query<{ group_id: number }>(
    `SELECT DISTINCT group_id
     FROM (
       SELECT group_id
       FROM coach_group_members
       WHERE user_id = $1
       UNION
       SELECT group_id
       FROM coach_group_coaches
       WHERE user_id = $1
       UNION
       SELECT id AS group_id
       FROM coach_groups
       WHERE manager_coach_user_id = $1
     ) scoped_groups`,
    [actor.id]
  );

  return result.rows
    .map((row) => toNumericId(row.group_id))
    .filter((groupId): groupId is number => groupId !== null);
}

export async function ensureGroupConversations(
  queryable: Queryable,
  actor: AuthUser,
  groupIds: number[]
) {
  for (const groupId of groupIds) {
    const existingConversation = await queryable.query<{ id: number }>(
      `SELECT id
       FROM conversations
       WHERE group_id = $1
       LIMIT 1`,
      [groupId]
    );

    const conversationId =
      existingConversation.rows[0]?.id ??
      (
        await queryable.query<{ id: number }>(
          `INSERT INTO conversations (type, group_id, created_by_user_id)
           VALUES ('group', $1, $2)
           ON CONFLICT (group_id)
           DO UPDATE SET last_message_at = conversations.last_message_at
           RETURNING id`,
          [groupId, actor.id]
        )
      ).rows[0]?.id;

    if (!conversationId) continue;

    const activeParticipants = await queryable.query<{
      user_id: number;
      role: UserRole;
    }>(
      `SELECT DISTINCT participant.user_id,
              participant.role
       FROM (
         SELECT users.id AS user_id,
                users.role AS role
         FROM coach_group_members
         INNER JOIN users ON users.id = coach_group_members.user_id
         WHERE coach_group_members.group_id = $1
         UNION
         SELECT users.id AS user_id,
                users.role AS role
         FROM coach_group_coaches
         INNER JOIN users ON users.id = coach_group_coaches.user_id
         WHERE coach_group_coaches.group_id = $1
         UNION
         SELECT users.id AS user_id,
                users.role AS role
         FROM coach_groups
         INNER JOIN users ON users.id = coach_groups.manager_coach_user_id
         WHERE coach_groups.id = $1
           AND coach_groups.manager_coach_user_id IS NOT NULL
       ) participant`,
      [groupId]
    );

    const participantIds = activeParticipants.rows
      .map((row) => toNumericId(row.user_id))
      .filter((userId): userId is number => userId !== null);

    for (const row of activeParticipants.rows) {
      const userId = toNumericId(row.user_id);
      if (userId === null) continue;

      await queryable.query(
        `INSERT INTO conversation_participants (
           conversation_id,
           user_id,
           role_snapshot,
           joined_at,
           left_at
         )
         VALUES ($1, $2, $3, NOW(), NULL)
         ON CONFLICT (conversation_id, user_id)
         DO UPDATE SET
           role_snapshot = EXCLUDED.role_snapshot,
           left_at = NULL`,
        [conversationId, userId, row.role]
      );
    }

    await queryable.query(
      `UPDATE conversation_participants
       SET left_at = NOW()
       WHERE conversation_id = $1
         AND user_id <> ALL($2::bigint[])
         AND left_at IS NULL`,
      [conversationId, participantIds.length > 0 ? participantIds : [0]]
    );
  }
}

export async function loadConversationSummaries(
  queryable: Queryable,
  actor: AuthUser,
  groupIds: number[]
) {
  return queryable.query<ConversationSummaryRow>(
    `SELECT conversations.id,
            conversations.type,
            conversations.group_id,
            coach_groups.name AS group_name,
            conversations.last_message_at,
            latest_message.content AS last_message_preview,
            COUNT(DISTINCT active_participants.user_id)::int AS participant_count,
            COUNT(DISTINCT unread_messages.id)::int AS unread_count,
            other_user.first_name AS other_user_first_name,
            other_user.last_name AS other_user_last_name,
            other_user.email AS other_user_email
     FROM conversations
     LEFT JOIN coach_groups ON coach_groups.id = conversations.group_id
     LEFT JOIN conversation_participants active_participants
       ON active_participants.conversation_id = conversations.id
      AND active_participants.left_at IS NULL
     LEFT JOIN LATERAL (
       SELECT conversation_messages.content
       FROM conversation_messages
       WHERE conversation_messages.conversation_id = conversations.id
         AND conversation_messages.deleted_at IS NULL
       ORDER BY conversation_messages.created_at DESC
       LIMIT 1
     ) latest_message ON TRUE
     LEFT JOIN conversation_reads
       ON conversation_reads.conversation_id = conversations.id
      AND conversation_reads.user_id = $1
     LEFT JOIN conversation_messages unread_messages
       ON unread_messages.conversation_id = conversations.id
      AND unread_messages.deleted_at IS NULL
      AND unread_messages.author_user_id IS DISTINCT FROM $1
      AND unread_messages.id > COALESCE(conversation_reads.last_read_message_id, 0)
      LEFT JOIN LATERAL (
        SELECT users.first_name,
               users.last_name,
               users.email
        FROM (
          SELECT CASE
            WHEN conversations.type = 'direct' THEN
              CASE
                WHEN conversations.direct_user_a_id = $1 THEN conversations.direct_user_b_id
                ELSE conversations.direct_user_a_id
              END
            ELSE (
              SELECT cp.user_id
              FROM conversation_participants cp
              WHERE cp.conversation_id = conversations.id
                AND cp.user_id <> $1
                AND cp.left_at IS NULL
              ORDER BY cp.joined_at ASC
              LIMIT 1
            )
          END AS user_id
        ) other_user_id
        LEFT JOIN users ON users.id = other_user_id.user_id
      ) other_user ON TRUE
      WHERE (
        conversations.type = 'group'
        AND conversations.group_id = ANY($2::bigint[])
      ) OR (
        conversations.type = 'direct'
        AND EXISTS (
          SELECT 1
          FROM conversation_participants
          WHERE conversation_participants.conversation_id = conversations.id
            AND conversation_participants.user_id = $1
            AND conversation_participants.left_at IS NULL
        )
      )
     GROUP BY conversations.id,
              conversations.type,
              conversations.group_id,
              coach_groups.name,
              conversations.last_message_at,
              latest_message.content,
              other_user.first_name,
              other_user.last_name,
              other_user.email
     ORDER BY CASE WHEN conversations.type = 'group' THEN 0 ELSE 1 END,
              conversations.last_message_at DESC,
              conversations.id DESC`,
    [actor.id, groupIds.length > 0 ? groupIds : [0]]
  );
}

export async function getAccessibleConversationMap(queryable: Queryable, actor: AuthUser) {
  const groupIds = await listAccessibleGroupIds(queryable, actor);
  await ensureGroupConversations(queryable, actor, groupIds);
  const summaries = await loadConversationSummaries(queryable, actor, groupIds);

  return new Map(
    summaries.rows.map((row) => [toNumericId(row.id) ?? 0, normalizeConversationPreview(row)])
  );
}

export async function assertCanAccessConversation(
  queryable: Queryable,
  actor: AuthUser,
  conversationId: number
) {
  const conversations = await getAccessibleConversationMap(queryable, actor);
  const conversation = conversations.get(conversationId) ?? null;

  if (!conversation) {
    throw new Error("Forbidden");
  }

  return conversation;
}

export async function loadDirectConversationPreview(
  queryable: Queryable,
  actor: AuthUser,
  conversationId: number
): Promise<ConversationPreview | null> {
  const result = await queryable.query<ConversationSummaryRow>(
    `SELECT conversations.id,
            conversations.type,
            conversations.group_id,
            coach_groups.name AS group_name,
            conversations.last_message_at,
            latest_message.content AS last_message_preview,
            COUNT(DISTINCT active_participants.user_id)::int AS participant_count,
            COUNT(DISTINCT unread_messages.id)::int AS unread_count,
            other_user.first_name AS other_user_first_name,
            other_user.last_name AS other_user_last_name,
            other_user.email AS other_user_email
     FROM conversations
     LEFT JOIN coach_groups ON coach_groups.id = conversations.group_id
     LEFT JOIN conversation_participants active_participants
       ON active_participants.conversation_id = conversations.id
      AND active_participants.left_at IS NULL
     LEFT JOIN LATERAL (
       SELECT conversation_messages.content
       FROM conversation_messages
       WHERE conversation_messages.conversation_id = conversations.id
         AND conversation_messages.deleted_at IS NULL
       ORDER BY conversation_messages.created_at DESC
       LIMIT 1
     ) latest_message ON TRUE
     LEFT JOIN conversation_reads
       ON conversation_reads.conversation_id = conversations.id
      AND conversation_reads.user_id = $1
     LEFT JOIN conversation_messages unread_messages
       ON unread_messages.conversation_id = conversations.id
      AND unread_messages.deleted_at IS NULL
      AND unread_messages.author_user_id IS DISTINCT FROM $1
      AND unread_messages.id > COALESCE(conversation_reads.last_read_message_id, 0)
      LEFT JOIN LATERAL (
        SELECT users.first_name,
               users.last_name,
               users.email
        FROM (
          SELECT CASE
            WHEN conversations.direct_user_a_id = $1 THEN conversations.direct_user_b_id
            ELSE conversations.direct_user_a_id
          END AS user_id
        ) other_user_id
        LEFT JOIN users ON users.id = other_user_id.user_id
      ) other_user ON TRUE
      WHERE conversations.id = $2
        AND conversations.type = 'direct'
       AND EXISTS (
         SELECT 1
         FROM conversation_participants
         WHERE conversation_participants.conversation_id = conversations.id
           AND conversation_participants.user_id = $1
           AND conversation_participants.left_at IS NULL
       )
     GROUP BY conversations.id,
              conversations.type,
              conversations.group_id,
              coach_groups.name,
              conversations.last_message_at,
              latest_message.content,
              other_user.first_name,
              other_user.last_name,
              other_user.email`,
    [actor.id, conversationId]
  );

  const row = result.rows[0];
  return row ? normalizeConversationPreview(row) : null;
}

export async function loadConversationParticipants(queryable: Queryable, conversationId: number) {
  const result = await queryable.query<ParticipantRow>(
    `SELECT conversation_participants.user_id,
            users.first_name,
            users.last_name,
            users.email,
            conversation_participants.role_snapshot,
            conversation_participants.joined_at,
            conversation_participants.left_at
     FROM conversation_participants
     INNER JOIN users ON users.id = conversation_participants.user_id
     WHERE conversation_participants.conversation_id = $1
     ORDER BY conversation_participants.left_at NULLS FIRST,
              conversation_participants.joined_at ASC`,
    [conversationId]
  );

  return result.rows.map(
    (row): ConversationParticipantSummary => ({
      userId: toNumericId(row.user_id) ?? 0,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      role: row.role_snapshot,
      joinedAt: row.joined_at,
      leftAt: row.left_at,
    })
  );
}

export async function loadActiveConversationParticipantIds(
  queryable: Queryable,
  conversationId: number
) {
  const result = await queryable.query<{ user_id: number | string }>(
    `SELECT user_id
     FROM conversation_participants
     WHERE conversation_id = $1
       AND left_at IS NULL`,
    [conversationId]
  );

  return result.rows
    .map((row) => toNumericId(row.user_id))
    .filter((userId): userId is number => userId !== null);
}

export async function loadConversationMessages(
  queryable: Queryable,
  actor: AuthUser,
  conversationId: number
) {
  const result = await queryable.query<MessageRow>(
    `SELECT conversation_messages.id,
            conversation_messages.conversation_id,
            conversation_messages.type,
            conversation_messages.content,
            conversation_messages.metadata,
            conversation_messages.created_at,
            conversation_messages.edited_at,
            conversation_messages.deleted_at,
            conversation_messages.author_user_id,
            users.first_name AS author_first_name,
            users.last_name AS author_last_name,
            users.email AS author_email,
            users.role AS author_role
     FROM conversation_messages
     LEFT JOIN users ON users.id = conversation_messages.author_user_id
     WHERE conversation_messages.conversation_id = $1
     ORDER BY conversation_messages.created_at ASC, conversation_messages.id ASC`,
    [conversationId]
  );

  return result.rows.map((row) => toConversationMessage(row, actor.id));
}

export async function markConversationAsReadInternal(
  queryable: Queryable,
  actor: AuthUser,
  conversationId: number
) {
  const latestMessageResult = await queryable.query<{ id: number; created_at: string }>(
    `SELECT id, created_at
     FROM conversation_messages
     WHERE conversation_id = $1
       AND deleted_at IS NULL
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [conversationId]
  );

  const latestMessage = latestMessageResult.rows[0];
  if (!latestMessage) {
    return false;
  }

  await queryable.query(
    `INSERT INTO conversation_reads (
       conversation_id,
       user_id,
       last_read_message_id,
       last_read_at
     )
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (conversation_id, user_id)
     DO UPDATE SET
       last_read_message_id = CASE
         WHEN EXCLUDED.last_read_at > conversation_reads.last_read_at
           OR (
             EXCLUDED.last_read_at = conversation_reads.last_read_at
             AND EXCLUDED.last_read_message_id > conversation_reads.last_read_message_id
           )
         THEN EXCLUDED.last_read_message_id
         ELSE conversation_reads.last_read_message_id
       END,
       last_read_at = CASE
         WHEN EXCLUDED.last_read_at > conversation_reads.last_read_at
           OR (
             EXCLUDED.last_read_at = conversation_reads.last_read_at
             AND EXCLUDED.last_read_message_id > conversation_reads.last_read_message_id
           )
         THEN EXCLUDED.last_read_at
         ELSE conversation_reads.last_read_at
       END`,
    [conversationId, actor.id, latestMessage.id, latestMessage.created_at]
  );

  return true;
}

export async function getUserSummary(queryable: Queryable, userId: number) {
  const result = await queryable.query<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
  }>(
    `SELECT id, first_name, last_name, email, role
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] ?? null;
}
