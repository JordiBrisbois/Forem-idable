import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import {
  importCoachApplicationsForUser,
  updateCoachApplicationNotes,
  type CoachImportDateFormat,
} from "@/lib/server/coach";
import {
  coachImportRequestSchema,
  coachNotesActionSchema,
} from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const PATCH = withSessionHandler(
  {
    access: "coach",
    body: coachNotesActionSchema,
    fallbackMessage: "Impossible de mettre à jour les notes coach.",
  },
  async ({ user, body, params }) => {
    const userId = parseRouteId(params.userId as string);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    const application = await updateCoachApplicationNotes({
      actor: user,
      userId,
      jobId: body.jobId,
      privateNoteContent: body.action === "save-private" ? body.content ?? "" : undefined,
      sharedNoteContent:
        body.action === "create-shared" || body.action === "update-shared"
          ? body.content ?? ""
          : undefined,
      sharedNoteId:
        body.action === "update-shared" || body.action === "delete-shared"
          ? body.noteId
          : undefined,
      createSharedNote: body.action === "create-shared",
      deleteSharedNote: body.action === "delete-shared",
    });

    return NextResponse.json({ application });
  }
);

export const POST = withSessionHandler(
  {
    access: "coach",
    body: coachImportRequestSchema,
    bodyErrorMessage: "Aucune ligne à importer.",
    fallbackMessage: "Impossible d'importer le suivi CSV.",
  },
  async ({ user, body, params }) => {
    const userId = parseRouteId(params.userId as string);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    const imported = await importCoachApplicationsForUser({
      actor: user,
      userId,
      dateFormat: (body.dateFormat ?? "dmy") as CoachImportDateFormat,
      rows: body.rows.map((row) => ({
        company: row.company ?? "",
        contractType: row.contractType,
        title: row.title ?? "",
        location: row.location,
        appliedAt: row.appliedAt,
        status: row.status,
        notes: row.notes,
      })),
    });

    return NextResponse.json({
      importedCount: imported.applications.length,
      createdCount: imported.createdCount,
      updatedCount: imported.updatedCount,
      ignoredCount: imported.ignoredCount,
      applications: imported.applications,
    });
  }
);
