import { beforeEach, describe, expect, it, vi } from "vitest";

const { listDueAlerts, markJobAlertSent, searchOffers, sendJobAlertEmail, isResendConfigured } =
  vi.hoisted(() => ({
    listDueAlerts: vi.fn(async () => []),
    markJobAlertSent: vi.fn(async () => undefined),
    searchOffers: vi.fn(async () => ({ jobs: [], total: 0 })),
    sendJobAlertEmail: vi.fn(async () => undefined),
    isResendConfigured: vi.fn(() => true),
  }));

vi.mock("./repository", () => ({ listDueAlerts, markJobAlertSent }));
vi.mock("@/lib/server/offers/repository", () => ({ searchOffers }));
vi.mock("./email", () => ({ sendJobAlertEmail }));
vi.mock("@/lib/server/mailer", () => ({ isResendConfigured }));
vi.mock("@/lib/server/observability", () => ({ logServerEvent: vi.fn() }));

import { runAlertsDigest } from "./service";

function alert(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    userId: 1,
    email: "user@example.com",
    firstName: "Ada",
    name: "Développeur à Namur",
    keywords: ["développeur"],
    locations: [],
    booleanMode: "OR",
    goal: "job",
    contractTypes: [],
    regimes: [],
    sectors: [],
    languages: [],
    frequency: "daily",
    isActive: true,
    createdAt: new Date("2026-03-01T00:00:00Z"),
    lastSentAt: null,
    unsubscribeToken: "tok",
    ...overrides,
  };
}

describe("runAlertsDigest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isResendConfigured.mockReturnValue(true);
    listDueAlerts.mockResolvedValue([]);
  });

  it("does nothing without a Resend key", async () => {
    isResendConfigured.mockReturnValue(false);

    const result = await runAlertsDigest();

    expect(result.sent).toBe(0);
    expect(listDueAlerts).not.toHaveBeenCalled();
  });

  it("sends one email per alert with new offers and marks it sent", async () => {
    listDueAlerts.mockResolvedValue([alert()] as never);
    searchOffers.mockResolvedValue({
      jobs: [{ id: "1", title: "Offre", location: "Namur", contractType: "CDI", publicationDate: "", url: "u", source: "forem" }],
      total: 4,
    } as never);

    const result = await runAlertsDigest({ now: new Date("2026-03-02T08:00:00Z") });

    expect(result).toEqual({ considered: 1, sent: 1, empty: 0, failed: 0 });
    expect(sendJobAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com", totalMatching: 4, unsubscribeToken: "tok" })
    );
    expect(markJobAlertSent).toHaveBeenCalledOnce();
  });

  it("stays quiet when nothing new matches, without marking the alert sent", async () => {
    listDueAlerts.mockResolvedValue([alert()] as never);
    searchOffers.mockResolvedValue({ jobs: [], total: 0 } as never);

    const result = await runAlertsDigest();

    expect(result).toMatchObject({ empty: 1, sent: 0 });
    expect(sendJobAlertEmail).not.toHaveBeenCalled();
    expect(markJobAlertSent).not.toHaveBeenCalled();
  });

  it("keeps going when one recipient fails", async () => {
    listDueAlerts.mockResolvedValue([
      alert({ id: 1, email: "a@example.com" }),
      alert({ id: 2, email: "b@example.com" }),
    ] as never);
    searchOffers.mockResolvedValue({
      jobs: [{ id: "1", title: "Offre", location: "Namur", contractType: "CDI", publicationDate: "", url: "u", source: "forem" }],
      total: 1,
    } as never);
    sendJobAlertEmail.mockRejectedValueOnce(new Error("resend down"));

    const result = await runAlertsDigest();

    expect(result).toMatchObject({ considered: 2, sent: 1, failed: 1 });
    expect(markJobAlertSent).toHaveBeenCalledOnce();
  });

  it("only asks for offers ingested since the previous send", async () => {
    const lastSentAt = new Date("2026-03-01T08:00:00Z");
    listDueAlerts.mockResolvedValue([alert({ lastSentAt })] as never);
    searchOffers.mockResolvedValue({ jobs: [], total: 0 } as never);

    await runAlertsDigest();

    expect(searchOffers).toHaveBeenCalledWith(
      expect.objectContaining({ firstSeenAfter: lastSentAt })
    );
  });
});
