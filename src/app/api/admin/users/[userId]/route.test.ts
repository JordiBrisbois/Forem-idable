import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";

const mockRecordAuditEvent = vi.fn();
const mockAssertCanAccessCoachUser = vi.fn();
const mockMarkCoachAction = vi.fn();
const mockRequireAdminAccess = vi.fn();
const mockRequireCoachAccess = vi.fn();
const mockLogServerEvent = vi.fn();
const mockWithRequestContext = vi.fn(
  async (_request: NextRequest, run: (context: { requestId: string; method: string; path: string }) => Promise<Response>) =>
    run({ requestId: "req-1", method: "PATCH", path: "/api/admin/users/42" })
);
const mockRejectCrossOriginRequest = vi.fn();
const mockParseIntegerParam = vi.fn();
const mockReadValidatedJson = vi.fn();
const mockDbQuery = vi.fn();
const mockEnsureDatabase = vi.fn();
const mockSetUserPassword = vi.fn();
const mockUpdateUserProfile = vi.fn();

vi.mock("@/lib/server/auditLog", () => ({
  recordAuditEvent: (...args: unknown[]) => mockRecordAuditEvent(...args),
}));

vi.mock("@/lib/server/coach", () => ({
  assertCanAccessCoachUser: (...args: unknown[]) => mockAssertCanAccessCoachUser(...args),
  markCoachAction: (...args: unknown[]) => mockMarkCoachAction(...args),
  requireAdminAccess: (...args: unknown[]) => mockRequireAdminAccess(...args),
  requireCoachAccess: (...args: unknown[]) => mockRequireCoachAccess(...args),
}));

vi.mock("@/lib/server/observability", () => ({
  logServerEvent: (...args: unknown[]) => mockLogServerEvent(...args),
  withRequestContext: (...args: unknown[]) => (mockWithRequestContext as unknown as (...a: unknown[]) => unknown)(...args),
}));

vi.mock("@/lib/server/requestOrigin", () => ({
  rejectCrossOriginRequest: (...args: unknown[]) => mockRejectCrossOriginRequest(...args),
}));

vi.mock("@/lib/server/requestSchemas", () => ({
  managedUserUpdateSchema: {},
  parseIntegerParam: (...args: unknown[]) => mockParseIntegerParam(...args),
  readValidatedJson: (...args: unknown[]) => mockReadValidatedJson(...args),
}));

vi.mock("@/lib/server/db", () => ({
  ensureDatabase: (...args: unknown[]) => mockEnsureDatabase(...args),
  db: {
    query: (...args: unknown[]) => mockDbQuery(...args),
  },
}));

vi.mock("@/lib/server/auth", () => ({
  deleteUserAccount: vi.fn(),
  setUserPassword: (...args: unknown[]) => mockSetUserPassword(...args),
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
}));

describe("PATCH /api/admin/users/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRejectCrossOriginRequest.mockReturnValue(null);
    mockRequireCoachAccess.mockResolvedValue({
      id: 7,
      role: "coach",
    });
    mockParseIntegerParam.mockReturnValue(42);
    mockReadValidatedJson.mockResolvedValue({
      success: true,
      data: {
        firstName: "Jordi",
        lastName: "Brisbois",
        password: undefined,
      },
    });
    mockDbQuery.mockResolvedValue({
      rows: [{ role: "user", email: "target@example.com" }],
    });
  });

  it("blocks coaches from editing unmanaged users", async () => {
    mockAssertCanAccessCoachUser.mockRejectedValue(Object.assign(new Error("Forbidden"), { name: "Error" }));

    const response = await PATCH(
      new NextRequest("https://example.com/api/admin/users/42", {
        method: "PATCH",
        headers: {
          origin: "https://example.com",
          "content-type": "application/json",
        },
        body: JSON.stringify({ firstName: "Jordi", lastName: "Brisbois" }),
      }),
      { params: Promise.resolve({ userId: "42" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Modification interdite pour ce périmètre." });
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });
});
