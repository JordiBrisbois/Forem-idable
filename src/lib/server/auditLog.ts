import { db, ensureDatabase } from "@/lib/server/db";
import { toIso } from "@/lib/server/compliance/shared";
import { getActiveLegalHold } from "@/lib/server/compliance/legalHolds";

export type AuditAction =
  | "admin_role_changed"
  | "api_key_revoked"
  | "user_deleted"
  | "user_profile_updated"
  | "featured_search_created"
  | "featured_search_updated"
  | "featured_search_deleted"
  | "group_created"
  | "group_deleted"
  | "group_member_added"
  | "group_member_removed"
  | "group_coach_assigned"
  | "group_coach_removed"
  | "group_manager_changed"
  | "group_phase_changed"
  | "user_phase_changed"
  | "group_archived"
  | "group_unarchived"
  | "coach_csv_import_completed"
  | "user_data_export_requested"
  | "account_deletion_requested"
  | "account_deletion_cancelled"
  | "account_deletion_approved"
  | "account_deletion_rejected"
  | "account_deletion_completed"
  | "legal_hold_created"
  | "legal_hold_released"
  | "disclosure_logged";

export type AdminAuditLogSummary = {
  id: number;
  action: string;
  createdAt: string;
  payload: Record<string, unknown>;
  actor: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  targetUser: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  group: {
    id: number;
    name: string;
  } | null;
};

export async function anonymizeAuditLogsForUser(userId: number) {
  await ensureDatabase();
  const hold = await getActiveLegalHold("user", userId);
  if (hold) {
    // Conservation légale : on ne supprime ni n'anonymise les logs liés à cet utilisateur
    return { anonymized: false, reason: "active_legal_hold" };
  }

  await db.query(
    `UPDATE audit_logs
     SET actor_user_id = NULL,
         target_user_id = NULL,
         payload = payload || '{"anonymized": true}'::jsonb
     WHERE actor_user_id = $1 OR target_user_id = $1`,
    [userId]
  );

  return { anonymized: true };
}

export async function recordAuditEvent(input: {
  actorUserId: number;
  action: AuditAction;
  targetUserId?: number | null;
  groupId?: number | null;
  payload?: Record<string, unknown> | null;
}) {
  await ensureDatabase();
  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, target_user_id, group_id, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      input.actorUserId,
      input.action,
      input.targetUserId ?? null,
      input.groupId ?? null,
      JSON.stringify(input.payload ?? {}),
    ]
  );
}

export async function listAdminAuditLogs(limit = 200): Promise<AdminAuditLogSummary[]> {
  await ensureDatabase();
  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 500) : 200;
  const result = await db.query(
    `SELECT
       logs.id,
       logs.action,
       logs.payload,
       logs.created_at,
       actor.id AS actor_id,
       actor.email AS actor_email,
       actor.first_name AS actor_first_name,
       actor.last_name AS actor_last_name,
       actor.role AS actor_role,
       target_user.id AS target_user_id,
       target_user.email AS target_user_email,
       target_user.first_name AS target_user_first_name,
       target_user.last_name AS target_user_last_name,
       target_user.role AS target_user_role,
       groups.id AS group_id,
       groups.name AS group_name
     FROM audit_logs logs
     LEFT JOIN users actor ON actor.id = logs.actor_user_id
     LEFT JOIN users target_user ON target_user.id = logs.target_user_id
     LEFT JOIN coach_groups groups ON groups.id = logs.group_id
     ORDER BY logs.created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    action: row.action,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    payload:
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {},
    actor: row.actor_id
      ? {
          id: row.actor_id,
          email: row.actor_email,
          firstName: row.actor_first_name,
          lastName: row.actor_last_name,
          role: row.actor_role,
        }
      : null,
    targetUser: row.target_user_id
      ? {
          id: row.target_user_id,
          email: row.target_user_email,
          firstName: row.target_user_first_name,
          lastName: row.target_user_last_name,
          role: row.target_user_role,
        }
      : null,
    group: row.group_id
      ? {
          id: row.group_id,
          name: row.group_name,
        }
      : null,
  }));
}
