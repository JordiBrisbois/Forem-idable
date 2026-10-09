import { NextRequest, NextResponse } from "next/server";
import { requireCoachAccess } from "@/lib/server/coach";
import { setBeneficiaryStage } from "@/lib/server/coachGroups";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { beneficiaryStageUpdateSchema, readValidatedJson } from "@/lib/server/requestSchemas";

function parseUserId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await requireCoachAccess();
      if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { userId: rawUserId } = await context.params;
      const userId = parseUserId(rawUserId);
      const parsed = await readValidatedJson(request, beneficiaryStageUpdateSchema);

      if (!userId || !parsed.success) {
        return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
      }

      await setBeneficiaryStage(userId, parsed.data.stage, parsed.data.reason, user);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const { userId: rawUserId } = await context.params;
      const userId = parseUserId(rawUserId);

      logServerEvent({
        category: "coach",
        action: "user_stage_change_failed",
        level: error instanceof Error && error.message === "Forbidden" ? "warn" : "error",
        meta: {
          userId: userId ?? undefined,
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ error: "Changement d'étape impossible." }, { status: 500 });
    }
  });
}
