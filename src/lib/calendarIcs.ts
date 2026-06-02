import { runtimeConfig } from "@/config/runtime";
import { appendForemTrackingParam } from "@/lib/forem";
import { isManualApplication } from "@/lib/applications/sourceType";
import { CalendarFeedApplicationRow } from "@/types/calendar";

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildEventDescription(row: CalendarFeedApplicationRow) {
  const application = row.application;
  const offerUrl =
    application.job.url && !isManualApplication(application)
      ? appendForemTrackingParam(application.job.url)
      : "";

  return [
    `Beneficiaire: ${[row.userFirstName, row.userLastName].join(" ").trim() || row.userEmail}`,
    `Email: ${row.userEmail}`,
    row.groupNames.length > 0 ? `Groupes: ${row.groupNames.join(" | ")}` : "",
    `Entreprise: ${application.job.company || "Non precisee"}`,
    `Poste: ${application.job.title}`,
    application.job.location ? `Lieu: ${application.job.location}` : "",
    application.interviewDetails ? `Details: ${application.interviewDetails}` : "",
    offerUrl ? `Offre: ${offerUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildCalendarIcsFeed(input: {
  calendarName: string;
  rows: CalendarFeedApplicationRow[];
}) {
  const events = input.rows
    .filter((row) => Boolean(row.application.interviewAt))
    .map((row) => {
      const startsAt = toIcsDateTime(row.application.interviewAt!);
      if (!startsAt) return null;

      const startDate = new Date(row.application.interviewAt!);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const endsAt = toIcsDateTime(endDate.toISOString());
      const updatedAt = toIcsDateTime(row.application.updatedAt || new Date().toISOString());
      const summary = escapeIcsText(
        `Entretien - ${[row.userFirstName, row.userLastName].join(" ").trim() || row.userEmail} - ${row.application.job.company || "Entreprise"}`
      );
      const description = escapeIcsText(buildEventDescription(row));
      const location = escapeIcsText(row.application.job.location || "");
      const uid = `${row.userId}-${row.application.job.id}-interview@${runtimeConfig.app.calendarUidDomain}`;

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${updatedAt || startsAt}`,
        updatedAt ? `LAST-MODIFIED:${updatedAt}` : null,
        `DTSTART:${startsAt}`,
        endsAt ? `DTEND:${endsAt}` : null,
        "STATUS:CONFIRMED",
        `SUMMARY:${summary}`,
        description ? `DESCRIPTION:${description}` : null,
        location ? `LOCATION:${location}` : null,
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .filter((entry): entry is string => Boolean(entry));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${runtimeConfig.app.name}//Coach Calendar//FR`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(input.calendarName)}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}
