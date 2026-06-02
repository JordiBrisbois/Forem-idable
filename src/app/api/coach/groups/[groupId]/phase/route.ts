import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCoachAccess } from "@/lib/server/coach";
import { updateGroupPhase } from "@/lib/server/coachGroups";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

const bodySchema = z.object({
  phase: z.enum(["internship_search", "job_search", "placed", "dropped"]),
  reason: z.string().optional(),
});

function parseGroupId(value: string) {
  const groupId = Number(value);
  return Number.isInteger(groupId) ? groupId : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await requireCoachAccess();
      if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { groupId: rawGroupId } = await context.params;
      const groupId = parseGroupId(rawGroupId);
      const body = await request.json();
      const parseResult = bodySchema.safeParse(body);

      if (!groupId || !parseResult.success) {
        return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
      }

      const { phase, reason } = parseResult.data;
      const { updated, skipped } = await updateGroupPhase(groupId, phase, reason, user);
      return NextResponse.json({ ok: true, updated, skipped });
    } catch (error) {
      const { groupId: rawGroupId } = await context.params;
      const groupId = parseGroupId(rawGroupId);

      logServerEvent({
        category: "coach",
        action: "group_phase_change_failed",
        level: error instanceof Error && error.message === "Forbidden" ? "warn" : "error",
        meta: {
          groupId: groupId ?? undefined,
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ error: "Changement de phase impossible." }, { status: 500 });
    }
  });
}
