#!/usr/bin/env node
/**
 * Runs database migrations once per container lifecycle, then starts Next.js.
 * Optional: the app also self-migrates on first database access. This script is
 * only useful when running `next start` (non-standalone) and wanting migrations
 * to run explicitly at boot.
 */
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const LOCK_FILE = path.join(os.tmpdir(), "app-migration-applied.lock");

function main() {
  if (!fs.existsSync(LOCK_FILE)) {
    console.log("[start] Applying database migrations...");
    try {
      execSync("npx drizzle-kit migrate", { stdio: "inherit", cwd: process.cwd() });
      fs.writeFileSync(LOCK_FILE, new Date().toISOString());
      console.log("[start] Migrations applied.");
    } catch (error) {
      console.error("[start] Migration failed:", error instanceof Error ? error.message : error);
    }
  }

  console.log("[start] Starting Next.js...");
  execSync("npx next start", { stdio: "inherit", cwd: process.cwd() });
}

main();
