import { NextRequest, NextResponse } from "next/server";
import { requireExternalApiAccess } from "@/lib/server/externalApiRoute";
import { saveExternalPrivateNote } from "@/lib/server/externalApi";
import { parseIntegerParam, textContentSchema } from "@/lib/server/requestSchemas";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { applicationId: rawApplicationId } = await context.params;
    const applicationId = parseIntegerParam(rawApplicationId);
    if (!applicationId) {
      return NextResponse.json({ error: "Candidature invalide." }, { status: 400 });
    }

    const parsed = textContentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "content requis." }, { status: 400 });
    }
    const body = parsed.data;

    const response = await saveExternalPrivateNote(actor, applicationId, body.content);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }

    return NextResponse.json({ error: "Enregistrement note privée impossible." }, { status: 500 });
  }
}
