import { NextResponse } from "next/server";
import { requireExternalApiAccess } from "@/lib/server/externalApiRoute";

export async function GET() {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;
    return NextResponse.json({
      actor,
      capabilities: {
        formats: ["json", "csv"],
        searchFields: ["firstName", "lastName", "fullName", "email"],
        filters: [
          "search",
          "groupId",
          "userId",
          "role",
          "status",
          "dueOnly",
          "interviewOnly",
          "updatedAfter",
          "updatedBefore",
          "appliedAfter",
          "appliedBefore",
          "hasPrivateNote",
          "hasSharedNotes",
          "limit",
          "offset",
          "includeApplications",
          "includePrivateNote",
          "includeSharedNotes",
          "includeContributors",
        ],
        filtersByEndpoint: {
          applications: [
            "search",
            "userId",
            "groupId",
            "role",
            "status",
            "dueOnly",
            "interviewOnly",
            "updatedAfter",
            "updatedBefore",
            "appliedAfter",
            "appliedBefore",
            "hasPrivateNote",
            "hasSharedNotes",
            "limit",
            "offset",
            "includePrivateNote",
            "includeSharedNotes",
            "includeContributors",
          ],
          users: ["search", "groupId", "role", "includeApplications", "limit", "offset"],
          userDetailCsv: ["format"],
          groups: ["search", "groupId", "includeApplications", "limit", "offset"],
          groupDetailCsv: ["format"],
        },
        derivedFields: {
          externalApplications: [
            "isFollowUpDue",
            "isInterviewScheduled",
          ],
          csvColumns: ["Relance due", "Entretien planifie"],
        },
        writeActions: [
          "applications.upsert",
          "applications.patch",
          "applications.delete",
          "applications.private_note.save",
          "applications.shared_notes.create",
          "applications.shared_notes.update",
          "applications.shared_notes.delete",
        ],
        scope: {
          visibility: actor.role === "admin" ? "global" : "assigned_groups",
          description:
            actor.role === "admin"
              ? "Accès global à tous les groupes, bénéficiaires et candidatures."
              : "Accès limité aux groupes attribués au coach et aux bénéficiaires visibles dans ces groupes.",
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "API externe indisponible." }, { status: 500 });
  }
}
