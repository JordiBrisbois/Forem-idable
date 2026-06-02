import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { runDatabaseMigrations } from "@/lib/server/migrations";
import { logServerEvent } from "@/lib/server/observability";
import * as schema from "@/lib/server/schema";

declare global {
  var __foremIdablePool: Pool | undefined;
  var __foremIdableOrm: NodePgDatabase<typeof schema> | undefined;
  var __foremIdableMigrationPromise: Promise<void> | undefined;
}

const connectionString = process.env.DATABASE_URL?.trim() || "";

function getSslConfig() {
  const sslMode = process.env.DB_SSL_MODE?.trim().toLowerCase() ?? "disable";
  if (sslMode === "disable" || !sslMode) {
    return undefined;
  }

  const caFromBase64 = process.env.DB_SSL_CA_BASE64?.trim();
  const caFromPem = process.env.DB_SSL_CA_PEM?.trim();
  const ca = caFromBase64
    ? Buffer.from(caFromBase64, "base64").toString("utf8")
    : caFromPem || undefined;

  return {
    rejectUnauthorized: true,
    ca,
  };
}

function createPool() {
  if (!connectionString) return null;

  const pool = new Pool({
    connectionString,
    // Production runs on the private Coolify Docker network by default,
    // so SSL is disabled unless explicitly requested for an external database.
    ssl: getSslConfig(),
  });

  function getStatementPreview(query: unknown) {
    if (typeof query === "string") {
      return query.trim().split(/\s+/).slice(0, 4).join(" ");
    }

    if (
      query &&
      typeof query === "object" &&
      "text" in query &&
      typeof query.text === "string"
    ) {
      return query.text.trim().split(/\s+/).slice(0, 4).join(" ");
    }

    return "unknown";
  }

  const originalQuery = pool.query.bind(pool);
  const slowQueryThresholdMs = Number(process.env.DB_SLOW_QUERY_MS ?? "200");
  pool.query = (async (...args: Parameters<typeof originalQuery>) => {
    const start = performance.now();

    try {
      const result = await originalQuery(...args);
      const statement = getStatementPreview(args[0]);
      const durationMs = performance.now() - start;

      if (durationMs >= slowQueryThresholdMs) {
        logServerEvent({
          category: "db",
          action: "slow_query",
          level: "warn",
          durationMs,
          meta: {
            statement,
            thresholdMs: slowQueryThresholdMs,
          },
          timing: true,
        });
      }

      return result;
    } catch (error) {
      const statement = getStatementPreview(args[0]);

      logServerEvent({
        category: "db",
        action: "query",
        level: "error",
        durationMs: performance.now() - start,
        meta: {
          statement,
          thresholdMs: slowQueryThresholdMs,
          error: error instanceof Error ? error.message : "unknown",
        },
        timing: true,
      });

      throw error;
    }
  }) as typeof pool.query;

  return pool;
}

const _db = globalThis.__foremIdablePool ?? createPool();

/**
 * The database pool. Typed as non-null because every production code path
 * calls ensureDatabase() before use, which throws if the pool could not be
 * created (e.g. DATABASE_URL missing). In tests the pool may be mocked.
 */
export const db = _db as Pool;
export const orm =
  globalThis.__foremIdableOrm ?? (_db ? drizzle(_db, { schema, casing: "snake_case" }) : null);

if (_db && !globalThis.__foremIdablePool) {
  globalThis.__foremIdablePool = _db;
}

if (orm && !globalThis.__foremIdableOrm) {
  globalThis.__foremIdableOrm = orm;
}

export async function ensureDatabase() {
  if (!_db) {
    throw new Error("Database unavailable");
  }

  if (!globalThis.__foremIdableMigrationPromise) {
    globalThis.__foremIdableMigrationPromise = runDatabaseMigrations(_db);
  }

  await globalThis.__foremIdableMigrationPromise;
}

// Start background scout worker only when explicitly enabled.
// Never start during build or test to avoid side effects.
if (
  typeof process !== "undefined" &&
  process.env.NODE_ENV !== "test" &&
  process.env.SCOUT_WORKER_ENABLED === "1"
) {
  import("@/lib/server/scoutWorker").then(({ startScoutWorker }) => {
    startScoutWorker();
  }).catch(() => {});
}
