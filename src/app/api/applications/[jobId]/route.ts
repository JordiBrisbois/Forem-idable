import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import {
  deleteApplicationForUser,
  updateApplicationForUser,
} from "@/lib/server/applications";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import {
  normalizeApplicationPatch,
  patchEnvelopeSchema,
  readValidatedJson,
} from "@/lib/server/requestSchemas";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await context.params;
    const parsed = await readValidatedJson(request, patchEnvelopeSchema);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const application = await updateApplicationForUser({
      userId: user.id,
      jobId,
      patch: normalizeApplicationPatch(jobId, parsed.data.patch),
    });

    return NextResponse.json({ application });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Manual job editing forbidden") {
      return NextResponse.json(
        { error: "Seules les candidatures manuelles peuvent modifier ces champs." },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: "Impossible de mettre à jour la candidature." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await context.params;
    await deleteApplicationForUser(user.id, jobId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Impossible de supprimer la candidature." }, { status: 500 });
  }
}
