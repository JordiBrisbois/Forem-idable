import { describe, expect, it } from "vitest";
import {
  formatCoachAuthorName,
  normalizeApplicationCoachNotes,
  preserveApplicationCoachFields,
  sanitizeApplicationForBeneficiary,
  summarizeCoachContributors,
} from "@/lib/coachNotes";
import { JobApplication } from "@/types/application";

function buildApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    job: {
      id: "job-1",
      title: "Développeur",
      company: "ACME",
      location: "Liège",
      contractType: "CDI",
      publicationDate: "2026-03-01T10:00:00.000Z",
      url: "https://example.com/job-1",
      source: "forem",
    },
    appliedAt: "2026-03-10T09:00:00.000Z",
    followUpDueAt: "2026-03-17T09:00:00.000Z",
    status: "in_progress",
    updatedAt: "2026-03-10T09:00:00.000Z",
    ...overrides,
  };
}

describe("coach notes helpers", () => {
  it("normalizes note content, contributors, and source type", () => {
    const normalized = normalizeApplicationCoachNotes({
      ...buildApplication(),
      sourceType: undefined,
      privateCoachNote: {
        content: "  Note privée  ",
        createdAt: "2026-03-10T09:00:00.000Z",
        updatedAt: "2026-03-10T09:00:00.000Z",
        createdBy: { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" },
        contributors: [
          { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" },
          { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" },
        ],
      },
      sharedCoachNotes: [
        {
          id: "n1",
          content: "  Note partagée  ",
          createdAt: "2026-03-10T09:00:00.000Z",
          updatedAt: "2026-03-10T09:00:00.000Z",
          createdBy: { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" },
          contributors: [
            { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" },
            { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" },
          ],
        },
        {
          id: "n2",
          content: "   ",
          createdAt: "2026-03-10T09:00:00.000Z",
          updatedAt: "2026-03-10T09:00:00.000Z",
          createdBy: { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" },
          contributors: [],
        },
      ],
    });

    expect(normalized.sourceType).toBe("tracked");
    expect(normalized.privateCoachNote?.content).toBe("Note privée");
    expect(normalized.privateCoachNote?.contributors).toHaveLength(1);
    expect(normalized.sharedCoachNotes).toHaveLength(1);
    expect(normalized.sharedCoachNotes?.[0].content).toBe("Note partagée");
    expect(normalized.sharedCoachNotes?.[0].contributors).toHaveLength(1);
  });

  it("hides private coach notes from beneficiaries and preserves server-side coach data", () => {
    const existing = buildApplication({
      privateCoachNote: {
        content: "Privée",
        createdAt: "2026-03-10T09:00:00.000Z",
        updatedAt: "2026-03-10T09:00:00.000Z",
        createdBy: { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" },
        contributors: [{ id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" }],
      },
      sharedCoachNotes: [
        {
          id: "n1",
          content: "Partagée",
          createdAt: "2026-03-10T09:00:00.000Z",
          updatedAt: "2026-03-10T09:00:00.000Z",
          createdBy: { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" },
          contributors: [{ id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" }],
        },
      ],
    });

    const sanitized = sanitizeApplicationForBeneficiary(existing);
    expect(sanitized.privateCoachNote).toBeUndefined();
    expect(sanitized.sharedCoachNotes).toHaveLength(1);

    const preserved = preserveApplicationCoachFields(existing, buildApplication());
    expect(preserved.privateCoachNote?.content).toBe("Privée");
    expect(preserved.sharedCoachNotes).toHaveLength(1);
  });

  it("formats and deduplicates contributor names", () => {
    const contributors = [
      { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" as const },
      { id: 1, firstName: "Jordi", lastName: "Brisbois", email: "j@x.dev", role: "coach" as const },
      { id: 2, firstName: "", lastName: "", email: "admin@x.dev", role: "admin" as const },
    ];

    expect(formatCoachAuthorName(contributors[0])).toBe("Jordi Brisbois");
    expect(summarizeCoachContributors(contributors)).toBe("Jordi Brisbois, admin@x.dev");
  });
});
