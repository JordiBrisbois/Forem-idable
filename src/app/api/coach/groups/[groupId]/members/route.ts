import { NextRequest, NextResponse } from "next/server";
import { addUserToCoachGroup, removeUserFromCoachGroup, requireCoachAccess } from "@/lib/server/coach";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { positiveIntegerBodySchema, readValidatedJson } from "@/lib/server/requestSchemas";

function parseGroupId(value: string) {
  const groupId = Number(value);
  return Number.isInteger(groupId) ? groupId : null;
}

export async function POST(
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

      if (!groupId) {
        return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
      }

      const parsed = await readValidatedJson(request, positiveIntegerBodySchema);
      if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
      const { userId } = parsed.data;

      await addUserToCoachGroup(groupId, userId, user);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const { groupId: rawGroupId } = await context.params;
      const groupId = parseGroupId(rawGroupId);

      logServerEvent({
        category: "coach",
        action: "group_member_add_failed",
        level: error instanceof Error && error.message === "Forbidden" ? "warn" : "error",
        meta: {
          groupId: groupId ?? undefined,
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ error: "Ajout au groupe impossible." }, { status: 500 });
    }
  });
}

export async function DELETE(
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
      const userId = Number(request.nextUrl.searchParams.get("userId"));

      if (!groupId || !Number.isInteger(userId)) {
        return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
      }

      await removeUserFromCoachGroup(groupId, userId, user);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const { groupId: rawGroupId } = await context.params;
      const groupId = parseGroupId(rawGroupId);
      const userId = Number(request.nextUrl.searchParams.get("userId"));

      logServerEvent({
        category: "coach",
        action: "group_member_remove_failed",
        level: error instanceof Error && error.message === "Forbidden" ? "warn" : "error",
        meta: {
          groupId: groupId ?? undefined,
          targetUserId: Number.isInteger(userId) ? userId : undefined,
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ error: "Suppression du groupe impossible." }, { status: 500 });
    }
  });
}
