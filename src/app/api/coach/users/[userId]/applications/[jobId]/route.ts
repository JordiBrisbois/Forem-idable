import { NextRequest, NextResponse } from "next/server";
import {
  deleteCoachManagedApplication,
  requireCoachAccess,
  updateCoachManagedApplication,
} from "@/lib/server/coach";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { parseIntegerParam, patchEnvelopeSchema } from "@/lib/server/requestSchemas";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string; jobId: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const viewer = await requireCoachAccess();
      if (!viewer) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { userId, jobId } = await context.params;
      const parsedUserId = parseIntegerParam(userId);
      if (!parsedUserId) {
        return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
      }
      const parsed = patchEnvelopeSchema.safeParse(await request.json());
      if (!parsed.success) {
        return NextResponse.json({ error: "Modification invalide." }, { status: 400 });
      }
      const body = parsed.data;

      const application = await updateCoachManagedApplication({
        actor: viewer,
        userId: parsedUserId,
        jobId,
        patch: body.patch,
      });

      return NextResponse.json({ application });
    } catch (error) {
      const { userId, jobId } = await context.params;
      const parsedUserId = parseIntegerParam(userId);
      const message = error instanceof Error ? error.message : "unknown";

      logServerEvent({
        category: "coach",
        action: "application_update_failed",
        level:
          message === "Forbidden" ||
          message === "Application not found" ||
          message === "Manual job editing forbidden"
            ? "warn"
            : "error",
        meta: {
          targetUserId: parsedUserId ?? undefined,
          jobId,
          error: message,
        },
      });

      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error instanceof Error && error.message === "Application not found") {
        return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
      }
      if (error instanceof Error && error.message === "Manual job editing forbidden") {
        return NextResponse.json(
          { error: "Seules les candidatures manuelles peuvent modifier ces champs." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "Impossible de mettre à jour la candidature." },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string; jobId: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const viewer = await requireCoachAccess();
      if (!viewer) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { userId, jobId } = await context.params;
      const parsedUserId = parseIntegerParam(userId);
      if (!parsedUserId) {
        return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
      }
      await deleteCoachManagedApplication({
        actor: viewer,
        userId: parsedUserId,
        jobId,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      const { userId, jobId } = await context.params;
      const parsedUserId = parseIntegerParam(userId);
      const message = error instanceof Error ? error.message : "unknown";

      logServerEvent({
        category: "coach",
        action: "application_delete_failed",
        level: message === "Forbidden" ? "warn" : "error",
        meta: {
          targetUserId: parsedUserId ?? undefined,
          jobId,
          error: message,
        },
      });

      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json(
        { error: "Impossible de supprimer la candidature." },
        { status: 500 }
      );
    }
  });
}
