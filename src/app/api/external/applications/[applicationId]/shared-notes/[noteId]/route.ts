import { NextRequest, NextResponse } from "next/server";
import {
  deleteExternalSharedNote,
  updateExternalSharedNote,
} from "@/lib/server/externalApi";
import { requireExternalApiAccess } from "@/lib/server/externalApiRoute";
import { parseIntegerParam, textContentSchema } from "@/lib/server/requestSchemas";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string; noteId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { applicationId: rawApplicationId, noteId } = await context.params;
    const applicationId = parseIntegerParam(rawApplicationId);
    if (!applicationId || !noteId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const parsed = textContentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "content requis." }, { status: 400 });
    }
    const body = parsed.data;

    const response = await updateExternalSharedNote(actor, applicationId, noteId, body.content);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }

    return NextResponse.json({ error: "Mise à jour note partagée impossible." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ applicationId: string; noteId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { applicationId: rawApplicationId, noteId } = await context.params;
    const applicationId = parseIntegerParam(rawApplicationId);
    if (!applicationId || !noteId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const response = await deleteExternalSharedNote(actor, applicationId, noteId);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }

    return NextResponse.json({ error: "Suppression note partagée impossible." }, { status: 500 });
  }
}
