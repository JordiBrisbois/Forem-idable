import { escapeCsvCell } from "@/lib/csv";
import {
  ExternalApiApplicationsResponse,
  ExternalApiGroupsResponse,
  ExternalApiUsersResponse,
} from "@/types/externalApi";
import { formatCoachAuthorName, summarizeCoachContributors } from "@/lib/coachNotes";
import { JobApplication } from "@/types/application";

export function formatNoteContributors(application: JobApplication) {
  return (application.sharedCoachNotes ?? [])
    .map((note) => summarizeCoachContributors(note.contributors))
    .join(" | ");
}

export function formatSharedNotes(application: JobApplication) {
  return (application.sharedCoachNotes ?? [])
    .map((note) => `${formatCoachAuthorName(note.createdBy)}: ${note.content}`)
    .join(" | ");
}

export function buildUsersCsv(users: ExternalApiUsersResponse["users"]) {
  const headers = [
    "ID",
    "Prénom",
    "Nom",
    "Email",
    "Rôle",
    "Groupes",
    "Candidatures",
    "Entretiens",
    "Relances dues",
    "Acceptées",
    "Refusées",
    "En cours",
    "Dernière activité",
  ];

  const rows = users.map((user) => [
    String(user.id),
    user.firstName,
    user.lastName,
    user.email,
    user.role,
    user.groupNames.join(" | "),
    String(user.applicationCount),
    String(user.interviewCount),
    String(user.dueCount),
    String(user.acceptedCount),
    String(user.rejectedCount),
    String(user.inProgressCount),
    user.latestActivityAt || "",
  ]);

  return toCsv(headers, rows);
}

export function buildGroupsCsv(groups: ExternalApiGroupsResponse["groups"]) {
  const headers = [
    "ID groupe",
    "Nom groupe",
    "Créé le",
    "Créé par",
    "Manager",
    "Nombre de coachs",
    "Coachs attribués",
    "Membres",
    "Candidatures",
    "Entretiens",
  ];

  const rows = groups.map((group) => [
    String(group.id),
    group.name,
    group.createdAt,
    group.createdBy.email,
    group.manager?.fullName || "",
    String(group.coachCount),
    group.coaches.map((coach) => coach.fullName).join(" | "),
    String(group.memberCount),
    String(group.totalApplications),
    String(group.totalInterviews),
  ]);

  return toCsv(headers, rows);
}

export function buildApplicationsCsv(applications: ExternalApiApplicationsResponse["applications"]) {
  const headers = [
    "Application ID",
    "User ID",
    "Job ID",
    "Prénom",
    "Nom",
    "Email",
    "Rôle",
    "Groupes",
    "Entreprise",
    "Intitulé",
    "Type",
    "Lieu",
    "Date envoyée",
    "Date relance",
    "Dernière relance",
    "Date entretien",
    "Entretien planifié",
    "Détails entretien",
    "Statut",
    "Relance due",
    "Notes bénéficiaire",
    "Preuves",
    "Note privée coach",
    "Contributeurs note privée",
    "Nombre notes partagées",
    "Notes coach partagées",
    "Contributeurs notes partagées",
    "Lien",
    "PDF",
    "Mis à jour le",
  ];

  const rows = applications.map((row) => [
    String(row.applicationId),
    String(row.userId),
    row.application.job.id,
    row.userFirstName,
    row.userLastName,
    row.userEmail,
    row.userRole,
    row.groupNames.join(" | "),
    row.application.job.company || "",
    row.application.job.title,
    row.application.job.contractType,
    row.application.job.location,
    row.application.appliedAt,
    row.application.followUpDueAt,
    row.application.lastFollowUpAt || "",
    row.application.interviewAt || "",
    row.isInterviewScheduled ? "yes" : "no",
    row.application.interviewDetails || "",
    row.application.status,
    row.isFollowUpDue ? "yes" : "no",
    row.application.notes || "",
    row.application.proofs || "",
    row.application.privateCoachNote?.content || "",
    row.application.privateCoachNote
      ? summarizeCoachContributors(row.application.privateCoachNote.contributors)
      : "",
    String(row.application.sharedCoachNotes?.length ?? 0),
    formatSharedNotes(row.application),
    formatNoteContributors(row.application),
    row.application.job.url || "",
    row.application.job.pdfUrl || "",
    row.application.updatedAt,
  ]);

  return toCsv(headers, rows);
}

function toCsv(headers: string[], rows: string[][]) {
  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell ?? "")).join(","))
    .join("\n");
}
