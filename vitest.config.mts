import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    pool: "threads",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    env: {
      // Deterministic branding so export filenames and calendar UIDs are stable.
      APP_NAME: "Test App",
      APP_EXPORT_FILENAME_PREFIX: "test-app",
      APP_STORAGE_NAMESPACE: "test_app",
      APP_CALENDAR_UID_DOMAIN: "test-app",
    },
    coverage: {
      provider: "v8",
      // text-summary keeps the CI log readable, lcov feeds the uploaded report.
      reporter: ["text-summary", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/types/**",
        // shadcn/ui primitives are vendored components, not application logic.
        "src/components/ui/**",
        // App Router entries are thin adapters over the server layer and are
        // exercised end-to-end by Playwright against a real Postgres.
        "src/app/**",
        // Drizzle table declarations: types, no behaviour.
        "src/lib/server/schema.ts",
      ],
      // A ratchet, not a target: the numbers sit just under today's measured
      // baseline so they cannot silently regress, and they are raised as tests
      // are added (see docs/testing.md). They are deliberately not aspirational:
      // a threshold nobody can meet gets skipped, one that matches reality gets
      // maintained.
      thresholds: {
        statements: 22,
        branches: 20,
        functions: 22,
        lines: 22,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(currentDir, "./src"),
    },
  },
});
