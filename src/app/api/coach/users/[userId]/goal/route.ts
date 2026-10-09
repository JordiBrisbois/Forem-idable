import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCoachAccess } from "@/lib/server/coach";
import { setUserSearchGoal } from "@/lib/server/coachGroups";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { searchGoalSchema } from "@/types/preferences";

const bodySchema = z.object({
  goal: searchGoalSchema,
  reason: z.string().optional(),
});

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
      const body = await request.json();
      const parsed = bodySchema.safeParse(body);

      if (!userId || !parsed.success) {
        return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
      }

      await setUserSearchGoal(userId, parsed.data.goal, parsed.data.reason, user);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const { userId: rawUserId } = await context.params;
      const userId = parseUserId(rawUserId);

      logServerEvent({
        category: "coach",
        action: "user_goal_change_failed",
        level: error instanceof Error && error.message === "Forbidden" ? "warn" : "error",
        meta: {
          userId: userId ?? undefined,
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ error: "Changement d'objectif impossible." }, { status: 500 });
    }
  });
}
