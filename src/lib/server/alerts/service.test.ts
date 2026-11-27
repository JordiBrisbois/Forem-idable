import { beforeEach, describe, expect, it, vi } from "vitest";

const { listDueAlerts, markJobAlertsSent, searchOffers, sendAlertsDigestEmail, isResendConfigured } =
  vi.hoisted(() => ({
    listDueAlerts: vi.fn(async () => []),
    markJobAlertsSent: vi.fn(async () => undefined),
    searchOffers: vi.fn(async () => ({ jobs: [], total: 0 })),
    sendAlertsDigestEmail: vi.fn(async () => undefined),
    isResendConfigured: vi.fn(() => true),
  }));

vi.mock("./repository", () => ({ listDueAlerts, markJobAlertsSent }));
vi.mock("@/lib/server/offers/repository", () => ({ searchOffers }));
vi.mock("./email", () => ({ sendAlertsDigestEmail }));
vi.mock("@/lib/server/mailer", () => ({ isResendConfigured }));
vi.mock("@/lib/server/observability", () => ({ logServerEvent: vi.fn() }));

import { runAlertsDigest } from "./service";

const newOffer = {
  id: "1",
  title: "Offre",
  location: "Namur",
  contractType: "CDI",
  publicationDate: "",
  url: "https://example.test/1",
  source: "forem" as const,
};

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
    searchOffers.mockResolvedValue({ jobs: [newOffer], total: 1 } as never);
  });

  it("does nothing without a Resend key", async () => {
    isResendConfigured.mockReturnValue(false);

    const result = await runAlertsDigest();

    expect(result.sent).toBe(0);
    expect(listDueAlerts).not.toHaveBeenCalled();
  });

  it("sends one email per person, even with several alerts", async () => {
    listDueAlerts.mockResolvedValue([
      alert({ id: 1, unsubscribeToken: "tok-1" }),
      alert({ id: 2, name: "Stages data", unsubscribeToken: "tok-2" }),
    ] as never);

    const result = await runAlertsDigest({ now: new Date("2026-03-02T08:00:00Z") });

    expect(result).toEqual({ considered: 2, sent: 1, empty: 0, failed: 0 });
    expect(sendAlertsDigestEmail).toHaveBeenCalledOnce();
    expect(sendAlertsDigestEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        sections: [
          expect.objectContaining({ alertName: "Développeur à Namur", unsubscribeToken: "tok-1" }),
          expect.objectContaining({ alertName: "Stages data", unsubscribeToken: "tok-2" }),
        ],
      })
    );
    // Both alerts are marked sent by the same email.
    expect(markJobAlertsSent).toHaveBeenCalledWith([1, 2], expect.any(Date));
  });

  it("sends one email per recipient", async () => {
    listDueAlerts.mockResolvedValue([
      alert({ id: 1, userId: 1, email: "a@example.com" }),
      alert({ id: 2, userId: 2, email: "b@example.com" }),
    ] as never);

    const result = await runAlertsDigest();

    expect(result.sent).toBe(2);
    expect(sendAlertsDigestEmail).toHaveBeenCalledTimes(2);
  });

  it("keeps quiet when nothing new matches, without marking the alert sent", async () => {
    listDueAlerts.mockResolvedValue([alert()] as never);
    searchOffers.mockResolvedValue({ jobs: [], total: 0 } as never);

    const result = await runAlertsDigest();

    expect(result).toMatchObject({ empty: 1, sent: 0 });
    expect(sendAlertsDigestEmail).not.toHaveBeenCalled();
    expect(markJobAlertsSent).not.toHaveBeenCalled();
  });

  it("only includes the alerts that have new offers", async () => {
    listDueAlerts.mockResolvedValue([
      alert({ id: 1, name: "Avec nouveautés" }),
      alert({ id: 2, name: "Sans nouveauté" }),
    ] as never);
    searchOffers
      .mockResolvedValueOnce({ jobs: [newOffer], total: 1 } as never)
      .mockResolvedValueOnce({ jobs: [], total: 0 } as never);

    await runAlertsDigest();

    expect(sendAlertsDigestEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: [expect.objectContaining({ alertName: "Avec nouveautés" })],
      })
    );
    expect(markJobAlertsSent).toHaveBeenCalledWith([1], expect.any(Date));
  });

  it("does not mark anything sent when the email fails", async () => {
    listDueAlerts.mockResolvedValue([alert({ id: 1 })] as never);
    sendAlertsDigestEmail.mockRejectedValueOnce(new Error("resend down"));

    const result = await runAlertsDigest();

    expect(result).toMatchObject({ sent: 0, failed: 1 });
    expect(markJobAlertsSent).not.toHaveBeenCalled();
  });

  it("only asks for offers ingested since the previous send", async () => {
    const lastSentAt = new Date("2026-03-01T08:00:00Z");
    listDueAlerts.mockResolvedValue([alert({ lastSentAt })] as never);

    await runAlertsDigest();

    expect(searchOffers).toHaveBeenCalledWith(
      expect.objectContaining({ firstSeenAfter: lastSentAt })
    );
  });
});
