import { describe, expect, it } from "vitest";
import { buildCalendarIcsFeed } from "@/lib/calendarIcs";
import { CalendarFeedApplicationRow } from "@/types/calendar";

const baseRow: CalendarFeedApplicationRow = {
  userId: 42,
  userEmail: "beneficiaire@example.com",
  userFirstName: "Ada",
  userLastName: "Lovelace",
  groupNames: ["Groupe A", "Groupe B"],
  application: {
    job: {
      id: "job-1",
      title: "Analyste",
      company: "ACME",
      location: "Namur",
      contractType: "CDI",
      publicationDate: "2026-03-01T10:00:00.000Z",
      url: "https://example.com/jobs/1",
      source: "forem",
    },
    appliedAt: "2026-03-10T09:00:00.000Z",
    followUpDueAt: "2026-03-17T09:00:00.000Z",
    status: "interview",
    updatedAt: "2026-03-11T08:00:00.000Z",
    interviewAt: "2026-03-12T13:30:00.000Z",
    interviewDetails: "Visio RH",
  },
};

describe("buildCalendarIcsFeed", () => {
  it("builds an ICS feed for interview events", () => {
    const content = buildCalendarIcsFeed({
      calendarName: "Calendrier test",
      rows: [baseRow],
    });

    expect(content).toContain("BEGIN:VCALENDAR");
    expect(content).toContain("X-WR-CALNAME:Calendrier test");
    expect(content).toContain("UID:42-job-1-interview@forem-idable");
    expect(content).toContain("SUMMARY:Entretien - Ada Lovelace - ACME");
    expect(content).toContain("DESCRIPTION:Beneficiaire: Ada Lovelace");
    expect(content).toContain("Email: beneficiaire@example.com");
    expect(content).toContain("Details: Visio RH");
    expect(content).toContain("LOCATION:Namur");
  });

  it("omits rows without interview date", () => {
    const content = buildCalendarIcsFeed({
      calendarName: "Calendrier test",
      rows: [
        {
          ...baseRow,
          application: {
            ...baseRow.application,
            interviewAt: undefined,
            status: "in_progress",
          },
        },
      ],
    });

    expect(content).not.toContain("BEGIN:VEVENT");
  });
});
