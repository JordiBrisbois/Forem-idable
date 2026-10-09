import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withExternalHandler, withSessionHandler } from "@/lib/server/apiHandler";
import { coachGroupCreateSchema } from "@/lib/server/requestSchemas";

const mockGetCurrentUser = vi.fn();
const mockRequireCoachAccess = vi.fn();
const mockRequireAdminAccess = vi.fn();
const mockRequireExternalApiAccess = vi.fn();

// Only the access layer is mocked. The wrapper under test uses the real CSRF
// check, Zod schemas, and error mapping so this exercises their integration.
vi.mock("@/lib/server/auth", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock("@/lib/server/coach", () => ({
  requireCoachAccess: () => mockRequireCoachAccess(),
  requireAdminAccess: () => mockRequireAdminAccess(),
}));

vi.mock("@/lib/server/externalApiRoute", () => ({
  requireExternalApiAccess: () => mockRequireExternalApiAccess(),
}));

const ORIGIN = "https://app.example.test";
const adminUser = { id: 1, email: "admin@example.test", firstName: "Ada", lastName: "Admin", role: "admin" as const };
const plainUser = { id: 2, email: "user@example.test", firstName: "Cam", lastName: "User", role: "user" as const };

function getRequest(path: string) {
  return new NextRequest(`${ORIGIN}${path}`, { method: "GET" });
}

function jsonRequest(path: string, body: unknown, origin = ORIGIN, method = "POST") {
  return new NextRequest(`${ORIGIN}${path}`, {
    method,
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("withSessionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for an unauthenticated user-scoped route", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    let called = false;
    const route = withSessionHandler({ access: "user", fallbackMessage: "boom" }, async () => {
      called = true;
      return NextResponse.json({ ok: true });
    });

    const response = await route(getRequest("/api/account"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(called).toBe(false);
  });

  it("returns 403 when the coach guard fails", async () => {
    mockRequireCoachAccess.mockResolvedValue(null);
    let called = false;
    const route = withSessionHandler({ access: "coach", fallbackMessage: "boom" }, async () => {
      called = true;
      return NextResponse.json({ ok: true });
    });

    const response = await route(getRequest("/api/coach/dashboard"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(called).toBe(false);
  });

  it("passes the typed user and a Zod-validated body to the handler", async () => {
    mockRequireAdminAccess.mockResolvedValue(adminUser);
    const route = withSessionHandler(
      { access: "admin", body: coachGroupCreateSchema, fallbackMessage: "boom" },
      async ({ user, body }) => NextResponse.json({ role: user.role, name: body.name })
    );

    const response = await route(jsonRequest("/api/coach/groups", { name: "Promo 2026" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ role: "admin", name: "Promo 2026" });
  });

  it("rejects an invalid body with 400 (custom message) before the handler runs", async () => {
    mockRequireAdminAccess.mockResolvedValue(adminUser);
    let called = false;
    const route = withSessionHandler(
      {
        access: "admin",
        body: coachGroupCreateSchema,
        bodyErrorMessage: "Nom de classe requis.",
        fallbackMessage: "boom",
      },
      async () => {
        called = true;
        return NextResponse.json({ ok: true });
      }
    );

    const response = await route(jsonRequest("/api/coach/groups", {}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Nom de classe requis." });
    expect(called).toBe(false);
  });

  it("blocks cross-origin mutations with the real CSRF check", async () => {
    mockRequireAdminAccess.mockResolvedValue(adminUser);
    let called = false;
    const route = withSessionHandler({ access: "admin", fallbackMessage: "boom" }, async () => {
      called = true;
      return NextResponse.json({ ok: true });
    });

    const response = await route(
      jsonRequest("/api/coach/groups", { name: "x" }, "https://evil.example")
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Requête interdite." });
    expect(called).toBe(false);
  });

  it("maps domain errors to HTTP status and message", async () => {
    mockGetCurrentUser.mockResolvedValue(plainUser);

    const forbidden = withSessionHandler({ access: "user", fallbackMessage: "boom" }, async () => {
      throw new Error("Forbidden");
    });
    const forbiddenResponse = await forbidden(getRequest("/api/account"));
    expect(forbiddenResponse.status).toBe(403);
    await expect(forbiddenResponse.json()).resolves.toEqual({ error: "Forbidden" });

    const notFound = withSessionHandler({ access: "user", fallbackMessage: "boom" }, async () => {
      throw new Error("User not found");
    });
    const notFoundResponse = await notFound(getRequest("/api/account"));
    expect(notFoundResponse.status).toBe(404);
    await expect(notFoundResponse.json()).resolves.toEqual({ error: "Utilisateur introuvable." });

    const unexpected = withSessionHandler({ access: "user", fallbackMessage: "Échec inattendu." }, async () => {
      throw new Error("kaboom");
    });
    const unexpectedResponse = await unexpected(getRequest("/api/account"));
    expect(unexpectedResponse.status).toBe(500);
    await expect(unexpectedResponse.json()).resolves.toEqual({ error: "Échec inattendu." });
  });

  it("forwards dynamic route params to the handler", async () => {
    mockRequireCoachAccess.mockResolvedValue({ id: 3, role: "coach" });
    const route = withSessionHandler(
      { access: "coach", fallbackMessage: "boom" },
      async ({ params }) => NextResponse.json({ groupId: params.groupId })
    );

    const response = await route(
      new NextRequest(`${ORIGIN}/api/coach/groups/42/archive`, {
        method: "PATCH",
        headers: { origin: ORIGIN },
      }),
      { params: Promise.resolve({ groupId: "42" }) }
    );

    await expect(response.json()).resolves.toEqual({ groupId: "42" });
  });
});

describe("withExternalHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the guard response when access is denied", async () => {
    mockRequireExternalApiAccess.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    let called = false;
    const route = withExternalHandler({ fallbackMessage: "boom" }, async () => {
      called = true;
      return NextResponse.json({ ok: true });
    });

    const response = await route(getRequest("/api/external/users"));

    expect(response.status).toBe(401);
    expect(called).toBe(false);
  });

  it("passes the resolved actor to the handler", async () => {
    mockRequireExternalApiAccess.mockResolvedValue({
      id: 9,
      email: "coach@example.test",
      firstName: "Co",
      lastName: "Ach",
      role: "coach",
    });

    const route = withExternalHandler(
      { fallbackMessage: "boom" },
      async ({ actor }) => NextResponse.json({ id: actor.id, role: actor.role })
    );

    const response = await route(getRequest("/api/external/users"));

    await expect(response.json()).resolves.toEqual({ id: 9, role: "coach" });
  });
});
