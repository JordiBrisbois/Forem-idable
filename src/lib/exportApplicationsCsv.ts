import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { runtimeConfig } from "@/config/runtime";
import { appendForemTrackingParam } from "@/lib/forem";
import { JobApplication, ApplicationStatus } from "@/types/application";
import { formatCoachAuthorName } from "@/lib/coachNotes";
import { escapeCsvCell } from "@/lib/csv";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  in_progress: "En cours",
  follow_up: "Relance à faire",
  interview: "Entretien",
  accepted: "Acceptée",
  rejected: "Refusée",
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "dd/MM/yyyy", { locale: fr });
}

export function exportApplicationsToCSV(applications: JobApplication[]) {
  if (!applications.length) return;

  const headers = [
    "Entreprise",
    "Intitulé",
    "Type",
    "Lieu",
    "Date envoyée",
    "Date relance",
    "Date entretien",
    "Statut",
    "Notes",
    "Preuves",
    "Notes coach partagées",
    "Lien",
  ];

  const rows = applications.map((entry) =>
    [
      entry.job.company || "",
      entry.job.title,
      entry.job.contractType,
      entry.job.location,
      formatDate(entry.appliedAt),
      entry.followUpEnabled === false ? "" : formatDate(entry.followUpDueAt),
      formatDate(entry.interviewAt),
      STATUS_LABELS[entry.status],
      entry.notes || "",
      entry.proofs || "",
      (entry.sharedCoachNotes ?? [])
        .map((note) => `${formatCoachAuthorName(note.createdBy)}: ${note.content}`)
        .join(" | "),
      appendForemTrackingParam(entry.job.url),
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `candidatures-${runtimeConfig.app.exportFilenamePrefix}-${format(new Date(), "yyyy-MM-dd")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
