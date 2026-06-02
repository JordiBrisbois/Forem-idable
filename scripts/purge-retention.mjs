import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL?.trim() || "";

if (!connectionString) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

function days(raw, fallback) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const passwordResetRetentionDays = days(process.env.PASSWORD_RESET_RETENTION_DAYS, 7);
const searchHistoryRetentionDays = days(process.env.SEARCH_HISTORY_RETENTION_DAYS, 365);
const dataExportRetentionDays = days(process.env.DATA_EXPORT_RETENTION_DAYS, 7);
const messageRetentionMonths = days(process.env.MESSAGE_RETENTION_MONTHS, 18);
const auditLogRetentionMonths = days(process.env.AUDIT_LOG_RETENTION_MONTHS, 24);

async function deleteCount(client, query, params = []) {
  const result = await client.query(query, params);
  return result.rowCount ?? 0;
}

async function main() {
  const summary = {
    expiredSessions: 0,
    stalePasswordResetTokens: 0,
    staleSearchHistory: 0,
    expiredDataExports: 0,
    expiredMessageContent: 0,
    expiredAuditLogs: 0,
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    summary.expiredSessions = await deleteCount(
      client,
      `DELETE FROM sessions
       WHERE expires_at < NOW()`
    );

    summary.stalePasswordResetTokens = await deleteCount(
      client,
      `DELETE FROM password_reset_tokens
       WHERE expires_at < NOW() - ($1::text || ' days')::interval
          OR (used_at IS NOT NULL AND used_at < NOW() - ($1::text || ' days')::interval)`,
      [String(passwordResetRetentionDays)]
    );

    summary.staleSearchHistory = await deleteCount(
      client,
      `DELETE FROM user_search_history
       WHERE created_at < NOW() - ($1::text || ' days')::interval`,
      [String(searchHistoryRetentionDays)]
    );

    summary.expiredDataExports = await deleteCount(
      client,
      `DELETE FROM data_export_requests
       WHERE COALESCE(expires_at, created_at + ($1::text || ' days')::interval)
             < NOW()`,
      [String(dataExportRetentionDays)]
    );

    summary.expiredMessageContent = await deleteCount(
      client,
      `UPDATE conversation_messages
       SET content = NULL,
           metadata = '{}'::jsonb,
           deleted_at = NOW()
       WHERE conversation_id IN (
         SELECT id FROM conversations
         WHERE last_message_at < NOW() - ($1::text || ' months')::interval
       )
       AND deleted_at IS NULL
       AND content IS NOT NULL`,
      [String(messageRetentionMonths)]
    );

    summary.expiredAuditLogs = await deleteCount(
      client,
      `DELETE FROM audit_logs
        WHERE created_at < NOW() - ($1::text || ' months')::interval
          AND actor_user_id NOT IN (
            SELECT target_id FROM legal_holds
            WHERE target_type = 'user' AND released_at IS NULL
          )
          AND target_user_id NOT IN (
            SELECT target_id FROM legal_holds
            WHERE target_type = 'user' AND released_at IS NULL
          )`,
      [String(auditLogRetentionMonths)]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    category: "maintenance",
    action: "purge_retention",
    summary,
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
