import { describe, expect, it, vi } from "vitest";

const { poolOnMock, poolQueryMock } = vi.hoisted(() => ({
  poolOnMock: vi.fn(),
  poolQueryMock: vi.fn(),
}));

vi.mock("pg", () => ({
  // A class, not an arrow function: `db.ts` calls `new Pool(...)`.
  Pool: class MockPool {
    on = poolOnMock;
    query = poolQueryMock;
  },
}));

vi.mock("@/lib/server/migrations", () => ({
  runDatabaseMigrations: vi.fn(),
}));

vi.mock("@/config/runtime", () => ({
  runtimeConfig: { app: { storageNamespace: "test" } },
}));

/**
 * A Postgres restart closes idle clients, and `pg` reports that as an 'error'
 * event on the pool. Without a listener Node raises an uncaughtException and the
 * whole app process dies — this is the regression guard for that.
 */
describe("database pool", () => {
  it("registers an error handler so a database restart cannot crash the process", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://user:password@localhost:5432/app");
    vi.resetModules();

    await import("@/lib/server/db");

    expect(poolOnMock).toHaveBeenCalledWith("error", expect.any(Function));

    vi.unstubAllEnvs();
  });
});
