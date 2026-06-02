import { NextRequest, NextResponse } from "next/server";
import {
  CoachImportDateFormat,
  importCoachApplicationsForUser,
  requireCoachAccess,
  updateCoachApplicationNotes,
} from "@/lib/server/coach";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import {
  coachImportRequestSchema,
  coachNotesActionSchema,
  parseIntegerParam,
} from "@/lib/server/requestSchemas";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  return withRequestContext(request, async () => {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const viewer = await requireCoachAccess();
    if (!viewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await context.params;
    const parsedUserId = parseIntegerParam(userId);
    if (!parsedUserId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }
    const parsed = coachNotesActionSchema.safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message || "Action invalide." }, { status: 400 });
    }
    const body = parsed.data;

    const application = await updateCoachApplicationNotes({
      actor: viewer,
      userId: parsedUserId,
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
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "Shared note content required") {
      return NextResponse.json({ error: "Contenu de note partagée requis." }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Impossible de mettre à jour les notes coach." },
      { status: 500 }
    );
  }});
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  return withRequestContext(request, async () => {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const viewer = await requireCoachAccess();
    if (!viewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await context.params;
    const parsedUserId = parseIntegerParam(userId);
    if (!parsedUserId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }
    const parsed = coachImportRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Aucune ligne à importer." }, { status: 400 });
    }
    const body = parsed.data;

    const importedApplications = await importCoachApplicationsForUser({
      actor: viewer,
      userId: parsedUserId,
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
      importedCount: importedApplications.applications.length,
      createdCount: importedApplications.createdCount,
      updatedCount: importedApplications.updatedCount,
      ignoredCount: importedApplications.ignoredCount,
      applications: importedApplications.applications,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    logServerEvent({
      category: "coach",
      action: "csv_import_failed",
      level: "error",
      meta: {
        targetUserId: Number((await context.params).userId),
        error: error instanceof Error ? error.message : "unknown",
      },
    });

    return NextResponse.json(
      { error: "Impossible d'importer le suivi CSV." },
      { status: 500 }
    );
  }});
}
