#!/usr/bin/env node
/**
 * Start script that runs db:migrate only if migrations have never been applied.
 * Uses a lock file in /tmp to avoid running migrations on every container restart.
 * Designed for Bun runtime.
 */

import { execSync } from "child_process";
import fs from "fs";

const LOCK_FILE = "/tmp/scout-migration-applied.lock";

async function main() {
  // Check if migrations were already applied in this container lifecycle
  if (!fs.existsSync(LOCK_FILE)) {
    console.log("[start] Running database migrations...");
    try {
      execSync("bun drizzle-kit migrate", {
        stdio: "inherit",
        cwd: process.cwd(),
        timeout: 60000,
      });
      fs.writeFileSync(LOCK_FILE, new Date().toISOString());
      console.log("[start] Migrations applied successfully.");
    } catch (error) {
      console.error("[start] Migration failed:", error instanceof Error ? error.message : error);
      // Don't exit - let the app try to start anyway (fail-open for already-migrated DBs)
    }
  } else {
    console.log("[start] Migrations already applied, skipping.");
  }

  // Start the Next.js app
  console.log("[start] Starting Next.js...");
  execSync("bun next start", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

main().catch((err) => {
  console.error("[start] Fatal error:", err);
  process.exit(1);
});
