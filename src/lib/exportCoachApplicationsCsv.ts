import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { appendForemTrackingParam } from "@/lib/forem";
import { ApplicationStatus, JobApplication } from "@/types/application";
import { formatCoachAuthorName, summarizeCoachContributors } from "@/lib/coachNotes";
import { escapeCsvCell } from "@/lib/csv";

export interface CoachApplicationExportRow {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  groupName?: string;
  application?: JobApplication;
  message?: string;
}

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
  return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
}

export function exportCoachApplicationsToCSV(input: {
  filenamePrefix: string;
  rows: CoachApplicationExportRow[];
}) {
  if (!input.rows.length) return;

  const headers = [
    "Prénom",
    "Nom",
    "Utilisateur",
    "Groupe",
    "Entreprise",
    "Intitulé",
    "Type",
    "Lieu",
    "Date envoyée",
    "Date relance",
    "Dernière relance",
    "Date entretien",
    "Détails entretien",
    "Statut",
    "Notes",
    "Preuves",
    "Note privée coach",
    "Contributeurs note privée",
    "Notes coach partagées",
    "Contributeurs notes partagées",
    "Lien",
  ];

  const rows = input.rows.map(
    ({ userFirstName, userLastName, userEmail, groupName, application, message }) => {
      if (!application) {
        return [
          userFirstName,
          userLastName,
          userEmail,
          groupName || "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "Aucune candidature",
          message || "",
          "",
          "",
          "",
          "",
        ]
          .map(escapeCsvCell)
          .join(",");
      }

      return [
        userFirstName,
        userLastName,
        userEmail,
        groupName || "",
        application.job.company || "",
        application.job.title,
        application.job.contractType,
        application.job.location,
        formatDate(application.appliedAt),
        application.followUpEnabled === false ? "" : formatDate(application.followUpDueAt),
        formatDate(application.lastFollowUpAt),
        formatDate(application.interviewAt),
        application.interviewDetails || "",
        STATUS_LABELS[application.status],
        application.notes || "",
        application.proofs || "",
        application.privateCoachNote?.content || "",
        application.privateCoachNote
          ? summarizeCoachContributors(application.privateCoachNote.contributors)
          : "",
        (application.sharedCoachNotes ?? [])
          .map((note) => `${formatCoachAuthorName(note.createdBy)}: ${note.content}`)
          .join(" | "),
        (application.sharedCoachNotes ?? [])
          .map((note) => summarizeCoachContributors(note.contributors))
          .join(" | "),
        appendForemTrackingParam(application.job.url || ""),
      ]
        .map(escapeCsvCell)
        .join(",");
    }
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${input.filenamePrefix}-${format(new Date(), "yyyy-MM-dd")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
