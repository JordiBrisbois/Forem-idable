import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/authz";
import { withExternalHandler } from "@/lib/server/apiHandler";

export const GET = withExternalHandler(
  { fallbackMessage: "API externe indisponible." },
  async ({ actor }) =>
    NextResponse.json({
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
          externalApplications: ["isFollowUpDue", "isInterviewScheduled"],
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
          visibility: isAdmin(actor.role) ? "global" : "assigned_groups",
          description: isAdmin(actor.role)
            ? "Accès global à tous les groupes, bénéficiaires et candidatures."
            : "Accès limité aux groupes attribués au coach et aux bénéficiaires visibles dans ces groupes.",
        },
      },
    })
);
