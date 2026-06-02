import { NextRequest, NextResponse } from "next/server";
import {
  addCoachToGroup,
  removeCoachFromGroup,
  requireCoachAccess,
} from "@/lib/server/coach";
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

      await addCoachToGroup(groupId, userId, user);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const { groupId: rawGroupId } = await context.params;
      const groupId = parseGroupId(rawGroupId);

      logServerEvent({
        category: "coach",
        action: "group_coach_add_failed",
        level:
          error instanceof Error &&
          (error.message === "Forbidden" || error.message === "Coach required")
            ? "warn"
            : "error",
        meta: {
          groupId: groupId ?? undefined,
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error instanceof Error && error.message === "Coach required") {
        return NextResponse.json({ error: "Seuls les comptes coach peuvent être attribués." }, { status: 400 });
      }

      return NextResponse.json({ error: "Attribution du coach impossible." }, { status: 500 });
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

      await removeCoachFromGroup(groupId, userId, user);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const { groupId: rawGroupId } = await context.params;
      const groupId = parseGroupId(rawGroupId);
      const userId = Number(request.nextUrl.searchParams.get("userId"));

      logServerEvent({
        category: "coach",
        action: "group_coach_remove_failed",
        level:
          error instanceof Error &&
          (error.message === "Forbidden" || error.message === "SelfRemovalForbidden")
            ? "warn"
            : "error",
        meta: {
          groupId: groupId ?? undefined,
          targetUserId: Number.isInteger(userId) ? userId : undefined,
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error instanceof Error && error.message === "SelfRemovalForbidden") {
        return NextResponse.json(
          { error: "Un coach ne peut pas se retirer lui-même d'un groupe attribué." },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: "Retrait du coach impossible." }, { status: 500 });
    }
  });
}
