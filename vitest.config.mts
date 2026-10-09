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
  },
  resolve: {
    alias: {
      "@": path.resolve(currentDir, "./src"),
    },
  },
});
