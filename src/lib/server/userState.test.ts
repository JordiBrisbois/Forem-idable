import { describe, expect, it } from "vitest";
import {
  mergeApplicationsWithServerFields,
  sanitizeApplicationsForBeneficiary,
} from "@/lib/server/userState";
import { JobApplication } from "@/types/application";

const baseApplication: JobApplication = {
  job: {
    id: "job-1",
    title: "Collaborateur admin polyvalent",
    company: "ESI Informatique",
    location: "Verviers",
    contractType: "CDD",
    publicationDate: "2026-03-10T10:00:00.000Z",
    url: "https://example.com/job-1",
    source: "forem",
  },
  appliedAt: "2026-03-13T10:00:00.000Z",
  followUpDueAt: "2026-03-20T10:00:00.000Z",
  status: "rejected",
  updatedAt: "2026-03-13T10:00:00.000Z",
};

describe("userState helpers", () => {
  it("preserves server-side coach fields when local sync payload does not include them", () => {
    const merged = mergeApplicationsWithServerFields({
      incoming: [{ ...baseApplication, notes: "note beneficiary" }],
      existing: [
        {
          ...baseApplication,
          sharedCoachNotes: [
            {
              id: "shared-1",
              content: "Relancer le bénéficiaire sur la suite",
              createdAt: "2026-03-13T11:00:00.000Z",
              updatedAt: "2026-03-13T11:00:00.000Z",
              createdBy: {
                id: 10,
                firstName: "Coach",
                lastName: "One",
                email: "coach@example.com",
                role: "coach",
              },
              contributors: [
                {
                  id: 10,
                  firstName: "Coach",
                  lastName: "One",
                  email: "coach@example.com",
                  role: "coach",
                },
              ],
            },
          ],
        },
      ],
    });

    expect(merged[0]?.sharedCoachNotes?.[0]?.content).toBe(
      "Relancer le bénéficiaire sur la suite"
    );
  });

  it("hides private notes from the beneficiary payload and keeps shared notes", () => {
    const sanitized = sanitizeApplicationsForBeneficiary([
      {
        ...baseApplication,
        privateCoachNote: {
          content: "Ne pas exposer",
          createdAt: "2026-03-13T10:00:00.000Z",
          updatedAt: "2026-03-13T10:00:00.000Z",
          createdBy: {
            id: 10,
            firstName: "Coach",
            lastName: "One",
            email: "coach@example.com",
            role: "coach",
          },
          contributors: [
            {
              id: 10,
              firstName: "Coach",
              lastName: "One",
              email: "coach@example.com",
              role: "coach",
            },
          ],
        },
      },
      {
        ...baseApplication,
        job: { ...baseApplication.job, id: "job-2" },
        sharedCoachNotes: [
          {
            id: "shared-1",
            content: "Visible",
            createdAt: "2026-03-13T10:00:00.000Z",
            updatedAt: "2026-03-13T10:00:00.000Z",
            createdBy: {
              id: 10,
              firstName: "Coach",
              lastName: "One",
              email: "coach@example.com",
              role: "coach",
            },
            contributors: [
              {
                id: 10,
                firstName: "Coach",
                lastName: "One",
                email: "coach@example.com",
                role: "coach",
              },
            ],
          },
        ],
      },
    ]);

    expect(sanitized[0]?.privateCoachNote).toBeUndefined();
    expect(sanitized[0]?.sharedCoachNotes).toEqual([]);
    expect(sanitized[1]?.sharedCoachNotes?.[0]?.content).toBe("Visible");
  });
});
