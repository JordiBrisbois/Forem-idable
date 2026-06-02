import { and, desc, eq } from "drizzle-orm";
import type { AuthUser } from "@/types/auth";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { db, ensureDatabase, orm } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/observability";
import { dataExportRequests } from "@/lib/server/schema";
import {
  mapDataExportSummary,
  type DataExportRequestSummary,
} from "@/lib/server/compliance/shared";

export async function listUserDataExportRequests(userId: number): Promise<DataExportRequestSummary[]> {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const result = await orm
    .select({
      id: dataExportRequests.id,
      status: dataExportRequests.status,
      format: dataExportRequests.format,
      created_at: dataExportRequests.createdAt,
      completed_at: dataExportRequests.completedAt,
      expires_at: dataExportRequests.expiresAt,
      error: dataExportRequests.error,
    })
    .from(dataExportRequests)
    .where(eq(dataExportRequests.userId, userId))
    .orderBy(desc(dataExportRequests.createdAt))
    .limit(10);

  return result.map(mapDataExportSummary);
}

export async function getUserDataExportPayload(userId: number, requestId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [row] = await orm
    .select({
      id: dataExportRequests.id,
      status: dataExportRequests.status,
      format: dataExportRequests.format,
      payload: dataExportRequests.payload,
      created_at: dataExportRequests.createdAt,
      completed_at: dataExportRequests.completedAt,
      expires_at: dataExportRequests.expiresAt,
      error: dataExportRequests.error,
    })
    .from(dataExportRequests)
    .where(and(eq(dataExportRequests.id, requestId), eq(dataExportRequests.userId, userId)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    summary: mapDataExportSummary(row),
    payload: row.payload,
  };
}

async function buildUserDataExport(userId: number) {
  const userResult = await db.query(
    `SELECT id, email, first_name, last_name, role, created_at, last_seen_at, last_coach_action_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );
  const user = userResult.rows[0] ?? null;

  const [settings, searchHistory, groups, managedGroups, applications, apiKeys, conversations] =
    await Promise.all([
      db.query(
        `SELECT settings, theme, analytics_consent, locations_cache, updated_at
         FROM user_settings
         WHERE user_id = $1
         LIMIT 1`,
        [userId]
      ),
      db.query(
        `SELECT entry_id, position, entry, created_at
         FROM user_search_history
         WHERE user_id = $1
         ORDER BY position ASC, created_at ASC`,
        [userId]
      ),
      db.query(
        `SELECT g.id, g.name, m.created_at AS joined_at
         FROM coach_group_members m
         INNER JOIN coach_groups g ON g.id = m.group_id
         WHERE m.user_id = $1
         ORDER BY g.name ASC`,
        [userId]
      ),
      db.query(
        `SELECT g.id, g.name, c.created_at AS assigned_at
         FROM coach_group_coaches c
         INNER JOIN coach_groups g ON g.id = c.group_id
         WHERE c.user_id = $1
         ORDER BY g.name ASC`,
        [userId]
      ),
      db.query(
        `SELECT a.*, aj.provider, aj.external_job_id, aj.title, aj.company, aj.location, aj.contract_type,
                aj.url, aj.publication_date, aj.pdf_url, aj.description, aj.raw_payload
         FROM applications a
         LEFT JOIN application_jobs aj ON aj.application_id = a.id
         WHERE a.user_id = $1
         ORDER BY a.updated_at DESC, a.id DESC`,
        [userId]
      ),
      db.query(
        `SELECT id, name, key_prefix, last_four, created_at, expires_at, last_used_at, revoked_at
         FROM api_keys
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      db.query(
        `SELECT c.id, c.type, c.group_id, c.direct_user_a_id, c.direct_user_b_id, c.created_by_user_id,
                c.created_at, c.last_message_at
         FROM conversation_participants cp
         INNER JOIN conversations c ON c.id = cp.conversation_id
         WHERE cp.user_id = $1
         ORDER BY c.last_message_at DESC`,
        [userId]
      ),
    ]);

  const applicationIds = applications.rows
    .map((row) => Number((row as { id: number }).id))
    .filter((value) => Number.isFinite(value));
  const conversationIds = conversations.rows
    .map((row) => Number((row as { id: number }).id))
    .filter((value) => Number.isFinite(value));

  const [
    privateNotes,
    privateNoteContributors,
    sharedNotes,
    sharedNoteContributors,
    applicationEvents,
    conversationParticipants,
    conversationMessages,
    conversationReads,
  ] = await Promise.all([
    applicationIds.length
      ? db.query(
          `SELECT *
           FROM application_private_notes
           WHERE application_id = ANY($1::bigint[])
           ORDER BY updated_at DESC`,
          [applicationIds]
        )
      : Promise.resolve({ rows: [] }),
    applicationIds.length
      ? db.query(
          `SELECT c.*
           FROM application_private_note_contributors c
           INNER JOIN application_private_notes n ON n.id = c.private_note_id
           WHERE n.application_id = ANY($1::bigint[])
           ORDER BY c.added_at ASC`,
          [applicationIds]
        )
      : Promise.resolve({ rows: [] }),
    applicationIds.length
      ? db.query(
          `SELECT *
           FROM application_shared_notes
           WHERE application_id = ANY($1::bigint[])
           ORDER BY updated_at DESC`,
          [applicationIds]
        )
      : Promise.resolve({ rows: [] }),
    applicationIds.length
      ? db.query(
          `SELECT c.*
           FROM application_shared_note_contributors c
           INNER JOIN application_shared_notes n ON n.id = c.shared_note_id
           WHERE n.application_id = ANY($1::bigint[])
           ORDER BY c.added_at ASC`,
          [applicationIds]
        )
      : Promise.resolve({ rows: [] }),
    applicationIds.length
      ? db.query(
          `SELECT *
           FROM application_events
           WHERE application_id = ANY($1::bigint[])
           ORDER BY created_at DESC`,
          [applicationIds]
        )
      : Promise.resolve({ rows: [] }),
    conversationIds.length
      ? db.query(
          `SELECT conversation_id,
                  CASE WHEN user_id = $2 THEN joined_at ELSE NULL END AS joined_at,
                  CASE WHEN user_id = $2 THEN left_at ELSE NULL END AS left_at,
                  user_id
           FROM conversation_participants
           WHERE conversation_id = ANY($1::bigint[])
           ORDER BY joined_at ASC`,
          [conversationIds, userId]
        )
      : Promise.resolve({ rows: [] }),
    conversationIds.length
      ? db.query(
          `SELECT id, conversation_id, type,
                  CASE WHEN author_user_id IS NULL OR author_user_id = $2 THEN content ELSE '[message d\'un autre participant]' END AS content,
                  CASE WHEN author_user_id IS NULL OR author_user_id = $2 THEN metadata ELSE '{}'::jsonb END AS metadata,
                  created_at, edited_at, deleted_at, author_user_id
           FROM conversation_messages
           WHERE conversation_id = ANY($1::bigint[])
           ORDER BY created_at ASC, id ASC`,
          [conversationIds, userId]
        )
      : Promise.resolve({ rows: [] }),
    conversationIds.length
      ? db.query(
          `SELECT id, conversation_id, user_id, last_read_message_id, last_read_at
           FROM conversation_reads
           WHERE conversation_id = ANY($1::bigint[])
             AND user_id = $2`,
          [conversationIds, userId]
        )
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    settings: settings.rows[0] ?? null,
    searchHistory: searchHistory.rows,
    groups: groups.rows,
    managedGroups: managedGroups.rows,
    applications: applications.rows,
    applicationPrivateNotes: privateNotes.rows,
    applicationPrivateNoteContributors: privateNoteContributors.rows,
    applicationSharedNotes: sharedNotes.rows,
    applicationSharedNoteContributors: sharedNoteContributors.rows,
    applicationEvents: applicationEvents.rows,
    apiKeys: apiKeys.rows,
    conversations: conversations.rows,
    conversationParticipants: conversationParticipants.rows,
    conversationMessages: conversationMessages.rows,
    conversationReads: conversationReads.rows,
  };
}

export async function createUserDataExport(user: AuthUser) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [createdRow] = await orm
    .insert(dataExportRequests)
    .values({
      userId: user.id,
      status: "pending",
      format: "json",
    })
    .returning({
      id: dataExportRequests.id,
      created_at: dataExportRequests.createdAt,
    });

  if (!createdRow) {
    throw new Error("Data export request creation failed");
  }

  try {
    const payload = await buildUserDataExport(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [updated] = await orm
      .update(dataExportRequests)
      .set({
        status: "completed",
        payload,
        completedAt: new Date(),
        expiresAt,
      })
      .where(eq(dataExportRequests.id, createdRow.id))
      .returning({
        id: dataExportRequests.id,
        status: dataExportRequests.status,
        format: dataExportRequests.format,
        created_at: dataExportRequests.createdAt,
        completed_at: dataExportRequests.completedAt,
        expires_at: dataExportRequests.expiresAt,
        error: dataExportRequests.error,
      });

    await recordAuditEvent({
      actorUserId: user.id,
      action: "user_data_export_requested",
      targetUserId: user.id,
      payload: {
        exportRequestId: createdRow.id,
        format: "json",
      },
    });

    logServerEvent({
      category: "compliance",
      action: "user_data_export_requested",
      meta: {
        actorUserId: user.id,
        exportRequestId: createdRow.id,
      },
    });

    return mapDataExportSummary(updated);
  } catch (error) {
    await orm
      .update(dataExportRequests)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : "Export impossible",
      })
      .where(eq(dataExportRequests.id, createdRow.id));
    throw error;
  }
}
