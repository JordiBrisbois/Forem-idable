#!/usr/bin/env node
/**
 * Reset the whole instance: drops every table and re-applies the baseline
 * migration, producing a clean, empty database ready for `/setup`.
 *
 * WARNING: destructive and irreversible. Make sure you have a backup first.
 *
 * Usage: node scripts/reset-demo.mjs
 */
import { execSync } from "child_process";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function main() {
  console.log("[reset] Dropping schemas public and drizzle...");
  await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
  await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
  await pool.query("CREATE SCHEMA public");
  console.log("[reset] Schemas dropped.");

  console.log("[reset] Re-applying the baseline migration...");
  execSync("npx drizzle-kit migrate", { stdio: "inherit", cwd: process.cwd() });

  console.log("[reset] Done. The instance is empty; open the app and go to /setup.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
