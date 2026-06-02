import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, setCoachGroupManager } from "@/lib/server/coach";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { positiveIntegerBodySchema, readValidatedJson } from "@/lib/server/requestSchemas";

function parseGroupId(value: string) {
  const groupId = Number(value);
  return Number.isInteger(groupId) ? groupId : null;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await requireAdminAccess();
      if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { groupId: rawGroupId } = await context.params;
      const groupId = parseGroupId(rawGroupId);

      if (!groupId) {
        return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
      }

      const parsed = await readValidatedJson(request, positiveIntegerBodySchema);
      if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
      const { userId } = parsed.data;

      await setCoachGroupManager(groupId, userId, user);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const { groupId: rawGroupId } = await context.params;
      const groupId = parseGroupId(rawGroupId);

      logServerEvent({
        category: "coach",
        action: "group_manager_set_failed",
        level: error instanceof Error && error.message === "Coach assignment required" ? "warn" : "error",
        meta: {
          groupId: groupId ?? undefined,
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      if (error instanceof Error && error.message === "Coach assignment required") {
        return NextResponse.json(
          { error: "Le manager doit être un coach déjà attribué à ce groupe." },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: "Définition du manager impossible." }, { status: 500 });
    }
  });
}
