import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mockGetCurrentUser = vi.fn();
const mockGetUserDataExportPayload = vi.fn();

vi.mock("@/lib/server/auth", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock("@/lib/server/compliance", () => ({
  getUserDataExportPayload: (...args: unknown[]) => mockGetUserDataExportPayload(...args),
}));

describe("GET /api/account/data-export/[requestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects expired exports", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 1 });
    mockGetUserDataExportPayload.mockResolvedValue({
      summary: {
        status: "completed",
        expiresAt: "2020-01-01T00:00:00.000Z",
      },
      payload: { ok: true },
    });

    const response = await GET(new Request("https://example.com"), {
      params: Promise.resolve({ requestId: "12" }),
    });

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({ error: "Export expiré." });
  });

  it("marks successful downloads as non-cacheable", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 1 });
    mockGetUserDataExportPayload.mockResolvedValue({
      summary: {
        status: "completed",
        expiresAt: "2999-01-01T00:00:00.000Z",
      },
      payload: { ok: true },
    });

    const response = await GET(new Request("https://example.com"), {
      params: Promise.resolve({ requestId: "12" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
