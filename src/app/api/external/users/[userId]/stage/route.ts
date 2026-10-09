import { NextRequest, NextResponse } from "next/server";
import { setBeneficiaryStage } from "@/lib/server/coachGroups";
import { requireExternalApiAccess } from "@/lib/server/externalApiRoute";
import { beneficiaryStageUpdateSchema, readValidatedJson } from "@/lib/server/requestSchemas";

function parseUserId(value: string) {
  const userId = Number(value);
  return Number.isInteger(userId) ? userId : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { userId: rawUserId } = await context.params;
    const userId = parseUserId(rawUserId);
    const parsed = await readValidatedJson(request, beneficiaryStageUpdateSchema);

    if (!userId || !parsed.success) {
      return NextResponse.json({ error: parsed.success ? "Paramètres invalides." : parsed.error }, { status: 400 });
    }

    await setBeneficiaryStage(userId, parsed.data.stage, parsed.data.reason, actor);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Changement d'étape impossible." }, { status: 500 });
  }
}
