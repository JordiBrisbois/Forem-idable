import { CoachApplicationExportRow } from "@/lib/exportCoachApplicationsCsv";
import { CoachUserSummary } from "@/types/coach";

export function buildUserExportRows(user: CoachUserSummary): CoachApplicationExportRow[] {
  return user.applications.length > 0
    ? user.applications.map((application) => ({
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userEmail: user.email,
        groupName: user.groupNames[0] ?? "",
        application,
      }))
    : [
        {
          userFirstName: user.firstName,
          userLastName: user.lastName,
          userEmail: user.email,
          groupName: user.groupNames[0] ?? "",
          message: "Utilisateur sans candidature au moment de l'export.",
        },
      ];
}

export function buildGroupExportRows(
  groupName: string,
  members: CoachUserSummary[]
): CoachApplicationExportRow[] {
  const rows: CoachApplicationExportRow[] = [];

  for (const entry of members) {
    if (entry.applications.length > 0) {
      for (const application of entry.applications) {
        rows.push({
          userFirstName: entry.firstName,
          userLastName: entry.lastName,
          userEmail: entry.email,
          groupName,
          application,
        });
      }
    } else {
      rows.push({
        userFirstName: entry.firstName,
        userLastName: entry.lastName,
        userEmail: entry.email,
        groupName,
        message: "Aucune candidature pour cet utilisateur dans ce groupe.",
      });
    }
  }

  return rows;
}
