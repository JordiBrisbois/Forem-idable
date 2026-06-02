import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";
import { logServerEvent } from "@/lib/server/observability";

interface MigrationJournalEntry {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface MigrationFile {
  tag: string;
  folderMillis: number;
  hash: string;
  statements: string[];
}

const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";

function getMigrationsFolder() {
  return path.join(process.cwd(), "drizzle");
}

async function readMigrationFiles(): Promise<MigrationFile[]> {
  const migrationsFolder = getMigrationsFolder();
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  const journal = JSON.parse(await fs.readFile(journalPath, "utf8")) as {
    entries: MigrationJournalEntry[];
  };

  const files = await Promise.all(
    journal.entries.map(async (entry) => {
      const migrationPath = path.join(migrationsFolder, `${entry.tag}.sql`);
      const sql = await fs.readFile(migrationPath, "utf8");
      return {
        tag: entry.tag,
        folderMillis: entry.when,
        hash: createHash("sha256").update(sql).digest("hex"),
        statements: sql
          .split("--> statement-breakpoint")
          .map((statement) => statement.trim())
          .filter(Boolean),
      } satisfies MigrationFile;
    })
  );

  return files.sort((left, right) => left.folderMillis - right.folderMillis);
}

async function ensureMigrationTable(pool: Pool) {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS "${MIGRATIONS_SCHEMA}"`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `);
}

async function hasLegacySchema(pool: Pool) {
  const result = await pool.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'users'
    ) AS exists
  `);

  return Boolean(result.rows[0]?.exists);
}

async function getLatestAppliedMigration(pool: Pool) {
  const result = await pool.query<{ created_at: string | number | null }>(
    `SELECT created_at
     FROM "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}"
     ORDER BY created_at DESC
     LIMIT 1`
  );

  const createdAt = result.rows[0]?.created_at;
  if (createdAt === null || createdAt === undefined) {
    return null;
  }

  return Number(createdAt);
}

async function markMigrationAsApplied(pool: Pool, migration: MigrationFile) {
  await pool.query(
    `INSERT INTO "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" ("hash", "created_at")
     VALUES ($1, $2)`,
    [migration.hash, migration.folderMillis]
  );
}

async function applyMigration(pool: Pool, migration: MigrationFile) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const statement of migration.statements) {
      await client.query(statement);
    }
    await client.query(
      `INSERT INTO "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" ("hash", "created_at")
       VALUES ($1, $2)`,
      [migration.hash, migration.folderMillis]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function runDatabaseMigrations(pool: Pool) {
  try {
    await ensureMigrationTable(pool);

    const migrations = await readMigrationFiles();
    if (migrations.length === 0) {
      return;
    }

    const latestApplied = await getLatestAppliedMigration(pool);
    if (latestApplied === null) {
      if (await hasLegacySchema(pool)) {
        for (const migration of migrations) {
          await markMigrationAsApplied(pool, migration);
        }
        return;
      }
    }

    for (const migration of migrations) {
      if (latestApplied !== null && latestApplied >= migration.folderMillis) {
        continue;
      }

      await applyMigration(pool, migration);
    }
  } catch (error) {
    logServerEvent({
      category: "db",
      action: "migration_failed",
      level: "error",
      meta: {
        error: error instanceof Error ? error.message : "unknown",
      },
    });
    throw error;
  }
}
