import { format } from "date-fns";
import { runtimeConfig } from "@/config/runtime";
import { isManualApplication } from "@/lib/applications/sourceType";
import { appendForemTrackingParam } from "@/lib/forem";
import { JobApplication } from "@/types/application";

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

export function exportInterviewsToICS(applications: JobApplication[]) {
  const interviews = applications.filter((entry) => entry.interviewAt);
  if (!interviews.length) return;

  const events = interviews
    .map((entry) => {
      const startsAt = toIcsDateTime(entry.interviewAt!);
      if (!startsAt) return null;

      const end = new Date(entry.interviewAt!);
      end.setHours(end.getHours() + 1);
      const endsAt = toIcsDateTime(end.toISOString());
      const title = escapeIcsText(
        `Entretien - ${entry.job.company || "Entreprise"} - ${entry.job.title}`
      );
      const offerUrl =
        entry.job.url && !isManualApplication(entry)
          ? appendForemTrackingParam(entry.job.url)
          : "";
      const description = escapeIcsText(
        [entry.job.location, entry.interviewDetails || "", offerUrl]
          .filter(Boolean)
          .join("\n")
      );
      const location = escapeIcsText(entry.job.location || "");
      const uid = `${entry.job.id}-interview@${runtimeConfig.app.calendarUidDomain}`;

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${toIcsDateTime(new Date().toISOString())}`,
        `DTSTART:${startsAt}`,
        endsAt ? `DTEND:${endsAt}` : null,
        `SUMMARY:${title}`,
        description ? `DESCRIPTION:${description}` : null,
        location ? `LOCATION:${location}` : null,
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .filter(Boolean);

  if (!events.length) return;

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${runtimeConfig.app.name}//Interviews//FR`,
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `entretiens-${runtimeConfig.app.exportFilenamePrefix}-${format(new Date(), "yyyy-MM-dd")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
