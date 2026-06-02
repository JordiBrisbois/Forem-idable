import { STORAGE_KEYS } from "@/lib/storageKeys";
import {
  listApplicationsFromRelationalStore,
  replaceApplicationsInRelationalStore,
} from "@/lib/server/applicationStore";
import { db, ensureDatabase } from "@/lib/server/db";
import {
  normalizeApplicationCoachNotes,
  preserveApplicationCoachFields,
  sanitizeApplicationForBeneficiary,
} from "@/lib/coachNotes";
import { JobApplication } from "@/types/application";
import { SearchHistoryEntry } from "@/features/jobs/types/searchHistory";
import { Job } from "@/types/job";

export interface PersistedUserState {
  values: Record<string, string>;
  updatedAt: string;
}

function sanitizeValues(input: unknown) {
  const values: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return values;
  }

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return values;
}

function safeJsonParse<T>(value: string | undefined | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function sanitizeApplicationsForBeneficiary(applications: JobApplication[]) {
  return applications.map((application) => sanitizeApplicationForBeneficiary(application));
}

export function mergeApplicationsWithServerFields(input: {
  incoming: JobApplication[];
  existing: JobApplication[];
}) {
  const existingByJobId = new Map(
    input.existing.map((application) => [application.job.id, application] as const)
  );

  return input.incoming.map((application) => {
    const existing = existingByJobId.get(application.job.id);
    if (!existing) {
      return normalizeApplicationCoachNotes(application);
    }

    return preserveApplicationCoachFields(existing, application);
  });
}

function buildValues(input: {
  favorites?: Job[];
  applications?: JobApplication[];
  searchHistory?: SearchHistoryEntry[];
  settings?: Record<string, unknown>;
  theme?: string | null;
  analyticsConsent?: string | null;
  locationsCache?: unknown;
}) {
  const values: Record<string, string> = {};

  if (input.favorites) {
    values[STORAGE_KEYS.favorites] = JSON.stringify(input.favorites);
  }

  if (input.applications) {
    values[STORAGE_KEYS.applications] = JSON.stringify(input.applications);
  }

  if (input.searchHistory) {
    values[STORAGE_KEYS.searchHistory] = JSON.stringify(input.searchHistory);
  }

  if (input.settings) {
    values[STORAGE_KEYS.settings] = JSON.stringify(input.settings);
  }

  if (input.theme) {
    values[STORAGE_KEYS.theme] = input.theme;
  }

  if (input.analyticsConsent) {
    values[STORAGE_KEYS.analyticsConsent] = input.analyticsConsent;
  }

  if (input.locationsCache !== undefined && input.locationsCache !== null) {
    values[STORAGE_KEYS.locationsCache] = JSON.stringify(input.locationsCache);
  }

  return values;
}

async function persistNormalizedState(userId: number, values: Record<string, string>) {
  const favorites = safeJsonParse<Job[]>(values[STORAGE_KEYS.favorites], []);
  const incomingApplications = safeJsonParse<JobApplication[]>(values[STORAGE_KEYS.applications], []);
  const searchHistory = safeJsonParse<SearchHistoryEntry[]>(values[STORAGE_KEYS.searchHistory], []);
  const settings = safeJsonParse<Record<string, unknown>>(values[STORAGE_KEYS.settings], {});
  const theme = values[STORAGE_KEYS.theme] ?? null;
  const analyticsConsent = values[STORAGE_KEYS.analyticsConsent] ?? null;
  const locationsCache = safeJsonParse<unknown>(values[STORAGE_KEYS.locationsCache], null);
  const existingRelationalApplications = await listApplicationsFromRelationalStore(userId);
  const applications = mergeApplicationsWithServerFields({
    incoming: incomingApplications,
    existing: existingRelationalApplications,
  });

  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM user_favorites WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM user_search_history WHERE user_id = $1", [userId]);
    await replaceApplicationsInRelationalStore(client, userId, applications);

    for (const [position, job] of favorites.entries()) {
      await client.query(
        `INSERT INTO user_favorites (user_id, job_id, position, job)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [userId, job.id, position, JSON.stringify(job)]
      );
    }

    for (const [position, entry] of searchHistory.entries()) {
      await client.query(
        `INSERT INTO user_search_history (user_id, entry_id, position, entry)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [userId, entry.id, position, JSON.stringify(entry)]
      );
    }

    await client.query(
      `INSERT INTO user_settings (user_id, settings, theme, analytics_consent, locations_cache, updated_at)
       VALUES ($1, $2::jsonb, $3, $4, $5::jsonb, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         settings = EXCLUDED.settings,
         theme = EXCLUDED.theme,
         analytics_consent = EXCLUDED.analytics_consent,
         locations_cache = EXCLUDED.locations_cache,
         updated_at = NOW()`,
      [userId, JSON.stringify(settings), theme, analyticsConsent, JSON.stringify(locationsCache)]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserState(userId: number): Promise<PersistedUserState | null> {
  await ensureDatabase();  const [favoritesResult, relationalApplications, searchHistoryResult, settingsResult] = await Promise.all([
    db.query<{ job: Job }>(
      `SELECT job
       FROM user_favorites
       WHERE user_id = $1
       ORDER BY position ASC`,
      [userId]
    ),
    listApplicationsFromRelationalStore(userId),
    db.query<{ entry: SearchHistoryEntry }>(
      `SELECT entry
       FROM user_search_history
       WHERE user_id = $1
       ORDER BY position ASC`,
      [userId]
    ),
    db.query<{
      settings: Record<string, unknown>;
      theme: string | null;
      analytics_consent: string | null;
      locations_cache: unknown;
      updated_at: string;
    }>(
      `SELECT settings, theme, analytics_consent, locations_cache, updated_at
       FROM user_settings
       WHERE user_id = $1`,
      [userId]
    ),
  ]);

  const hasNormalizedData =
    favoritesResult.rows.length > 0 ||
    relationalApplications.length > 0 ||
    searchHistoryResult.rows.length > 0 ||
    settingsResult.rows.length > 0;

  if (!hasNormalizedData) return null;

  const settingsRow = settingsResult.rows[0];
  const values = buildValues({
    favorites: favoritesResult.rows.map((row) => row.job),
    applications: sanitizeApplicationsForBeneficiary(relationalApplications),
    searchHistory: searchHistoryResult.rows.map((row) => row.entry),
    settings: settingsRow?.settings ?? {},
    theme: settingsRow?.theme ?? null,
    analyticsConsent: settingsRow?.analytics_consent ?? null,
    locationsCache: settingsRow?.locations_cache ?? null,
  });

  return {
    values,
    updatedAt: settingsRow?.updated_at ?? new Date(0).toISOString(),
  };
}

export async function saveUserState(userId: number, values: unknown) {
  await ensureDatabase();
  const sanitized = sanitizeValues(values);
  await persistNormalizedState(userId, sanitized);

  const settingsResult = await db.query<{
    updated_at: string;
  }>(
    `SELECT updated_at
     FROM user_settings
     WHERE user_id = $1`,
    [userId]
  );

  return {
    values: sanitized,
    updatedAt: settingsResult.rows[0]?.updated_at ?? new Date().toISOString(),
  };
}
