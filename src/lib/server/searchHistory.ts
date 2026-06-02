import { db, ensureDatabase } from "@/lib/server/db";
import { dedupeAndPrependHistory } from "@/features/jobs/utils/searchHistory";
import { SearchHistoryEntry } from "@/features/jobs/types/searchHistory";

const MAX_HISTORY_ITEMS = 8;

export async function listSearchHistoryForUser(userId: number) {
  await ensureDatabase();
  const result = await db.query<{ entry: SearchHistoryEntry }>(
    `SELECT entry
     FROM user_search_history
     WHERE user_id = $1
     ORDER BY position ASC`,
    [userId]
  );

  return result.rows.map((row) => row.entry);
}

async function persistSearchHistory(userId: number, history: SearchHistoryEntry[]) {
  await db.query("BEGIN");

  try {
    await db.query("DELETE FROM user_search_history WHERE user_id = $1", [userId]);

    for (const [position, entry] of history.entries()) {
      await db.query(
        `INSERT INTO user_search_history (user_id, entry_id, position, entry)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [userId, entry.id, position, JSON.stringify(entry)]
      );
    }

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

export async function addSearchHistoryEntryForUser(userId: number, entry: SearchHistoryEntry) {
  const current = await listSearchHistoryForUser(userId);
  const next = dedupeAndPrependHistory(current, entry, MAX_HISTORY_ITEMS);
  await persistSearchHistory(userId, next);
  return next;
}

export async function clearSearchHistoryForUser(userId: number) {
  await ensureDatabase();
  await db.query("DELETE FROM user_search_history WHERE user_id = $1", [userId]);
}
