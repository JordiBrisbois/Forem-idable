import { db, ensureDatabase } from "@/lib/server/db";
import { escapeHtml } from "@/lib/server/common";
import {
  assertCanAccessConversation,
  getAccessibleConversationMap,
  getUserSummary,
  loadConversationMessages,
  loadConversationParticipants,
  loadDirectConversationPreview,
  markConversationAsReadInternal,
} from "@/lib/server/messaging.data";
import { resolveSharedJobMetadata, toConversationMessage, toNumericId } from "@/lib/server/messaging.shared";
import { MessageRow, Queryable } from "@/lib/server/messaging.types";
import { AuthUser, UserRole } from "@/types/auth";
import {
  ConversationDetail,
  ConversationMessage,
  ConversationPreview,
  DirectMessageTarget,
} from "@/types/messaging";

export async function canModerateGroupConversation(
  queryable: Queryable,
  actor: AuthUser,
  conversationId: number
) {
  const conversationResult = await queryable.query<{
    type: ConversationPreview["type"];
    group_id: number | null;
  }>(
    `SELECT type, group_id
     FROM conversations
     WHERE id = $1
     LIMIT 1`,
    [conversationId]
  );

  const conversation = conversationResult.rows[0];
  if (!conversation || conversation.type !== "group" || !conversation.group_id) {
    return false;
  }

  if (actor.role === "admin") {
    return true;
  }

  const moderationScope = await queryable.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM coach_group_coaches
       WHERE coach_group_coaches.group_id = $1
         AND coach_group_coaches.user_id = $2
       UNION
       SELECT 1
       FROM coach_groups
       WHERE coach_groups.id = $1
         AND coach_groups.manager_coach_user_id = $2
     ) AS exists`,
    [conversation.group_id, actor.id]
  );

  return Boolean(moderationScope.rows[0]?.exists);
}

export async function canDirectMessage(actor: AuthUser, targetUserId: number) {
  if (actor.id === targetUserId) {
    return false;
  }

  await ensureDatabase();
  if (actor.role === "admin") {
    return true;
  }

  const result = await db.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
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
       ) actor_groups
       INNER JOIN (
         SELECT group_id
         FROM coach_group_members
         WHERE user_id = $2
         UNION
         SELECT group_id
         FROM coach_group_coaches
         WHERE user_id = $2
         UNION
         SELECT id AS group_id
         FROM coach_groups
         WHERE manager_coach_user_id = $2
       ) target_groups
         ON target_groups.group_id = actor_groups.group_id
     ) AS exists`,
    [actor.id, targetUserId]
  );

  return Boolean(result.rows[0]?.exists);
}

export async function listVisibleConversations(actor: AuthUser): Promise<ConversationPreview[]> {
  await ensureDatabase();
  const conversations = await getAccessibleConversationMap(db, actor);
  return Array.from(conversations.values());
}

export async function getConversationDetail(
  actor: AuthUser,
  conversationId: number
): Promise<ConversationDetail> {
  await ensureDatabase();
  const preview = await assertCanAccessConversation(db, actor, conversationId);
  const [participants, messages, canModerateMessages] = await Promise.all([
    loadConversationParticipants(db, conversationId),
    loadConversationMessages(db, actor, conversationId),
    canModerateGroupConversation(db, actor, conversationId),
  ]);

  return {
    ...preview,
    canModerateMessages,
    participants,
    messages,
  };
}

export async function markConversationAsRead(actor: AuthUser, conversationId: number) {
  await ensureDatabase();
  await assertCanAccessConversation(db, actor, conversationId);
  return markConversationAsReadInternal(db, actor, conversationId);
}

export async function sendTextMessage(
  actor: AuthUser,
  conversationId: number,
  content: string
): Promise<ConversationMessage | { ok: true; cleared: true }> {
  await ensureDatabase();
  const preview = await assertCanAccessConversation(db, actor, conversationId);

  const conversationResult = await db.query<{ type: ConversationPreview["type"] }>(
    `SELECT type
     FROM conversations
     WHERE id = $1
     LIMIT 1`,
    [conversationId]
  );
  const conversationType = conversationResult.rows[0]?.type ?? "group";
  const normalizedContent = content.trim();

  if (normalizedContent === "/clean") {
    const canModerate = await canModerateGroupConversation(db, actor, conversationId);
    if (preview.type !== "group" || !canModerate) {
      throw new Error("Forbidden");
    }

    await db.query(
      `UPDATE conversation_messages
       SET content = NULL,
           metadata = '{}'::jsonb,
           deleted_at = NOW()
       WHERE conversation_id = $1
         AND deleted_at IS NULL`,
      [conversationId]
    );

    await db.query(
      `DELETE FROM conversation_reads
       WHERE conversation_id = $1`,
      [conversationId]
    );

    await db.query(
      `UPDATE conversations
       SET last_message_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );

    return { ok: true, cleared: true };
  }

  const messagePayload = await resolveSharedJobMetadata(normalizedContent);

  // Escape HTML in content before storage to prevent stored XSS
  const safeContent = messagePayload.type === "text" ? escapeHtml(normalizedContent) : normalizedContent;

  const result = await db.query<MessageRow>(
    `INSERT INTO conversation_messages (
       conversation_id,
       author_user_id,
       type,
       content,
       metadata
     )
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id,
               conversation_id,
               type,
               content,
               metadata,
               created_at,
               edited_at,
               deleted_at,
               author_user_id,
               NULL::text AS author_first_name,
               NULL::text AS author_last_name,
               NULL::text AS author_email,
               NULL::text AS author_role`,
    [
      conversationId,
      actor.id,
      messagePayload.type,
      safeContent,
      JSON.stringify(messagePayload.metadata),
    ]
  );

  await db.query(
    `UPDATE conversations
     SET last_message_at = NOW()
     WHERE id = $1`,
    [conversationId]
  );

  if (conversationType === "direct") {
    await db.query(
      `UPDATE conversation_participants
       SET left_at = NULL
       WHERE conversation_id = $1`,
      [conversationId]
    );
  }

  await markConversationAsReadInternal(db, actor, conversationId);

  const author = await getUserSummary(db, actor.id);
  const row = result.rows[0];

  return toConversationMessage(
    {
      ...row,
      author_first_name: author?.first_name ?? actor.firstName,
      author_last_name: author?.last_name ?? actor.lastName,
      author_email: author?.email ?? actor.email,
      author_role: author?.role ?? actor.role,
    },
    actor.id
  );
}

export async function listDirectMessageTargets(actor: AuthUser): Promise<DirectMessageTarget[]> {
  await ensureDatabase();
  if (actor.role === "admin") {
    const result = await db.query<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      role: UserRole;
    }>(
      `SELECT id, first_name, last_name, email, role
       FROM users
       WHERE id <> $1
       ORDER BY first_name ASC, last_name ASC, email ASC`,
      [actor.id]
    );

    return result.rows.map((row) => ({
      userId: toNumericId(row.id) ?? 0,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      role: row.role,
      sharedGroupCount: 0,
      relationLabel: "Accès global",
    }));
  }

  const result = await db.query<{
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    shared_group_count: number;
  }>(
    `SELECT candidate.user_id,
            users.first_name,
            users.last_name,
            users.email,
            users.role,
            COUNT(DISTINCT candidate.group_id)::int AS shared_group_count
     FROM (
       SELECT coach_group_members.user_id,
              coach_group_members.group_id
       FROM coach_group_members
       WHERE coach_group_members.group_id IN (
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
       )
       UNION ALL
       SELECT coach_group_coaches.user_id,
              coach_group_coaches.group_id
       FROM coach_group_coaches
       WHERE coach_group_coaches.group_id IN (
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
       )
       UNION ALL
       SELECT coach_groups.manager_coach_user_id AS user_id,
              coach_groups.id AS group_id
       FROM coach_groups
       WHERE coach_groups.id IN (
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
       )
         AND coach_groups.manager_coach_user_id IS NOT NULL
     ) candidate
     INNER JOIN users ON users.id = candidate.user_id
     WHERE candidate.user_id <> $1
     GROUP BY candidate.user_id,
              users.first_name,
              users.last_name,
              users.email,
              users.role
     ORDER BY users.first_name ASC, users.last_name ASC, users.email ASC`,
    [actor.id]
  );

  return result.rows.map((row) => ({
    userId: toNumericId(row.user_id) ?? 0,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    sharedGroupCount: row.shared_group_count,
    relationLabel: `${row.shared_group_count} groupe${row.shared_group_count > 1 ? "s" : ""} commun${row.shared_group_count > 1 ? "s" : ""}`,
  }));
}

export async function findOrCreateDirectConversation(actor: AuthUser, targetUserId: number) {
  await ensureDatabase();
  const conversationId = await findOrCreateDirectConversationId(actor, targetUserId);
  const [preview, participants, messages] = await Promise.all([
    loadDirectConversationPreview(db, actor, conversationId),
    loadConversationParticipants(db, conversationId),
    loadConversationMessages(db, actor, conversationId),
  ]);

  if (!preview) {
    throw new Error("Forbidden");
  }

  return {
    ...preview,
    canModerateMessages: false,
    participants,
    messages,
  };
}

export async function findOrCreateDirectConversationId(actor: AuthUser, targetUserId: number) {
  await ensureDatabase();
  const [userAId, userBId] =
    actor.id < targetUserId ? [actor.id, targetUserId] : [targetUserId, actor.id];

  const existing = await db.query<{ id: number }>(
    `SELECT id
     FROM conversations
     WHERE type = 'direct'
       AND direct_user_a_id = $1
       AND direct_user_b_id = $2
     LIMIT 1`,
    [userAId, userBId]
  );

  const targetUser = await getUserSummary(db, targetUserId);
  if (!targetUser) {
    throw new Error("NotFound");
  }

  if (!existing.rows[0]?.id) {
    const [canMessage, availableTargets] = await Promise.all([
      canDirectMessage(actor, targetUserId),
      listDirectMessageTargets(actor),
    ]);

    const isListedTarget = availableTargets.some((target) => target.userId === targetUserId);
    if (!canMessage && !isListedTarget) {
      throw new Error("Forbidden");
    }
  }

  const rawConversationId =
    existing.rows[0]?.id ??
    (
      await db.query<{ id: number }>(
        `INSERT INTO conversations (
           type,
           direct_user_a_id,
           direct_user_b_id,
           created_by_user_id
         )
         VALUES ('direct', $1, $2, $3)
         ON CONFLICT (type, direct_user_a_id, direct_user_b_id)
         DO UPDATE SET last_message_at = conversations.last_message_at
         RETURNING id`,
        [userAId, userBId, actor.id]
      )
    ).rows[0]?.id;

  const conversationId = toNumericId(rawConversationId);

  if (!conversationId) {
    throw new Error("ConversationCreateFailed");
  }

  const participants = [
    {
      userId: actor.id,
      role: actor.role,
    },
    {
      userId: toNumericId(targetUser.id) ?? targetUserId,
      role: targetUser.role,
    },
  ];

  for (const participant of participants) {
    await db.query(
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
      [conversationId, participant.userId, participant.role]
    );
  }

  return conversationId;
}

export async function shareTextInDirectConversation(
  actor: AuthUser,
  targetUserId: number,
  content: string
) {
  await ensureDatabase();
  const conversationId = await findOrCreateDirectConversationId(actor, targetUserId);
  const normalizedContent = content.trim();
  if (normalizedContent === "/clean") {
    throw new Error("InvalidDirectMessageContent");
  }

  const messagePayload = await resolveSharedJobMetadata(normalizedContent);

  const result = await db.query<MessageRow>(
    `INSERT INTO conversation_messages (
       conversation_id,
       author_user_id,
       type,
       content,
       metadata
     )
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id,
               conversation_id,
               type,
               content,
               metadata,
               created_at,
               edited_at,
               deleted_at,
               author_user_id,
               NULL::text AS author_first_name,
               NULL::text AS author_last_name,
               NULL::text AS author_email,
               NULL::text AS author_role`,
    [
      conversationId,
      actor.id,
      messagePayload.type,
      normalizedContent,
      JSON.stringify(messagePayload.metadata),
    ]
  );

  await db.query(
    `UPDATE conversations
     SET last_message_at = NOW()
     WHERE id = $1`,
    [conversationId]
  );

  await db.query(
    `UPDATE conversation_participants
     SET left_at = NULL
     WHERE conversation_id = $1`,
    [conversationId]
  );

  await markConversationAsReadInternal(db, actor, conversationId);

  const author = await getUserSummary(db, actor.id);
  const row = result.rows[0];
  const message = toConversationMessage(
    {
      ...row,
      author_first_name: author?.first_name ?? actor.firstName,
      author_last_name: author?.last_name ?? actor.lastName,
      author_email: author?.email ?? actor.email,
      author_role: author?.role ?? actor.role,
    },
    actor.id
  );

  return { conversationId, message };
}

export async function closeDirectConversation(actor: AuthUser, conversationId: number) {
  await ensureDatabase();
  const preview = await assertCanAccessConversation(db, actor, conversationId);
  if (preview.type !== "direct") {
    throw new Error("InvalidConversationType");
  }

  await db.query(
    `UPDATE conversation_participants
     SET left_at = NOW()
     WHERE conversation_id = $1
       AND user_id = $2
       AND left_at IS NULL`,
    [conversationId, actor.id]
  );

  return true;
}

export async function deleteConversationMessage(
  actor: AuthUser,
  conversationId: number,
  messageId: number
) {
  await ensureDatabase();
  await assertCanAccessConversation(db, actor, conversationId);

  const messageResult = await db.query<{
    author_user_id: number | string | null;
    deleted_at: string | null;
  }>(
    `SELECT author_user_id, deleted_at
     FROM conversation_messages
     WHERE id = $1
       AND conversation_id = $2
     LIMIT 1`,
    [messageId, conversationId]
  );

  const targetMessage = messageResult.rows[0];
  if (!targetMessage || targetMessage.deleted_at) {
    throw new Error("NotFound");
  }

  const authorUserId = toNumericId(targetMessage.author_user_id);
  if (authorUserId === actor.id) {
    await db.query(
      `DELETE FROM conversation_messages
       WHERE id = $1
         AND conversation_id = $2`,
      [messageId, conversationId]
    );

    return null;
  }

  const canModerate = await canModerateGroupConversation(db, actor, conversationId);
  if (!canModerate) {
    throw new Error("Forbidden");
  }

  const result = await db.query<MessageRow>(
    `UPDATE conversation_messages
     SET content = NULL,
         metadata = '{}'::jsonb,
         deleted_at = NOW()
     WHERE id = $1
       AND conversation_id = $2
       AND deleted_at IS NULL
     RETURNING id,
               conversation_id,
               type,
               content,
               metadata,
               created_at,
               edited_at,
               deleted_at,
               author_user_id,
               NULL::text AS author_first_name,
               NULL::text AS author_last_name,
               NULL::text AS author_email,
               NULL::text AS author_role`,
    [messageId, conversationId]
  );

  if (!result.rows[0]) throw new Error("NotFound");

  const updatedMessage = result.rows[0];
  const author = updatedMessage.author_user_id
    ? await getUserSummary(db, toNumericId(updatedMessage.author_user_id) ?? 0)
    : null;

  return toConversationMessage(
    {
      ...updatedMessage,
      author_first_name: author?.first_name ?? null,
      author_last_name: author?.last_name ?? null,
      author_email: author?.email ?? null,
      author_role: author?.role ?? null,
    },
    actor.id
  );
}
