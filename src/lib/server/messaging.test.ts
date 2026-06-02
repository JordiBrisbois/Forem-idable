import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthUser } from "@/types/auth";

const { mockQuery, mockEnsureDatabase, mockGetUserSummary } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockEnsureDatabase: vi.fn(),
  mockGetUserSummary: vi.fn(),
}));

vi.mock("@/lib/server/db", () => ({
  db: {
    query: mockQuery,
  },
  ensureDatabase: mockEnsureDatabase,
}));

vi.mock("@/lib/server/messaging.data", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/messaging.data")>(
    "@/lib/server/messaging.data"
  );

  return {
    ...actual,
    getUserSummary: mockGetUserSummary,
  };
});

import {
  canDirectMessage,
  canModerateGroupConversation,
  findOrCreateDirectConversationId,
} from "@/lib/server/messaging";

const coachActor: AuthUser = {
  id: 11,
  email: "coach@example.com",
  firstName: "Coach",
  lastName: "One",
  role: "coach",
};

describe("messaging permissions", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockEnsureDatabase.mockReset();
    mockGetUserSummary.mockReset();
  });

  it("allows admins to message anyone without querying group scope", async () => {
    const allowed = await canDirectMessage(
      {
        id: 1,
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      },
      42
    );

    expect(allowed).toBe(true);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("allows direct messaging when users share at least one group scope", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ exists: true }] });

    const allowed = await canDirectMessage(coachActor, 42);

    expect(allowed).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("rejects direct messaging when users do not share a common group scope", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ exists: false }] });

    const allowed = await canDirectMessage(coachActor, 42);

    expect(allowed).toBe(false);
  });

  it("allows group message moderation for assigned coaches", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ type: "group", group_id: 55 }] })
      .mockResolvedValueOnce({ rows: [{ exists: true }] });

    const allowed = await canModerateGroupConversation(
      { query: mockQuery } as never,
      coachActor,
      99
    );

    expect(allowed).toBe(true);
  });

  it("rejects group message moderation for regular members", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ type: "group", group_id: 55 }] })
      .mockResolvedValueOnce({ rows: [{ exists: false }] });

    const allowed = await canModerateGroupConversation(
      { query: mockQuery } as never,
      {
        id: 21,
        email: "member@example.com",
        firstName: "Member",
        lastName: "User",
        role: "user",
      },
      99
    );

    expect(allowed).toBe(false);
  });

  it("normalizes direct conversation ids returned as strings", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "2" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    mockGetUserSummary.mockResolvedValueOnce({
      id: 42,
      role: "user",
    });

    const conversationId = await findOrCreateDirectConversationId(coachActor, 42);

    expect(conversationId).toBe(2);
    expect(typeof conversationId).toBe("number");
  });
});
