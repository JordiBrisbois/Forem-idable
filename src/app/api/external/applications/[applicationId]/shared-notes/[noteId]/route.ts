import { NextResponse } from "next/server";
import { withExternalHandler } from "@/lib/server/apiHandler";
import {
  deleteExternalSharedNote,
  updateExternalSharedNote,
} from "@/lib/server/externalApi";
import { textContentSchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const PATCH = withExternalHandler(
  {
    body: textContentSchema,
    bodyErrorMessage: "content requis.",
    fallbackMessage: "Mise à jour note partagée impossible.",
  },
  async ({ actor, body, params }) => {
    const applicationId = parseRouteId(params.applicationId as string);
    const noteId = params.noteId as string;
    if (!applicationId || !noteId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const response = await updateExternalSharedNote(actor, applicationId, noteId, body.content);
    return NextResponse.json(response);
  }
);

export const DELETE = withExternalHandler(
  { fallbackMessage: "Suppression note partagée impossible." },
  async ({ actor, params }) => {
    const applicationId = parseRouteId(params.applicationId as string);
    const noteId = params.noteId as string;
    if (!applicationId || !noteId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const response = await deleteExternalSharedNote(actor, applicationId, noteId);
    return NextResponse.json(response);
  }
);
