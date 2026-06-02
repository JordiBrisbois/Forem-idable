import { NextRequest, NextResponse } from "next/server";
import { createCoachGroup, deleteCoachGroup, requireCoachAccess } from "@/lib/server/coach";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { coachGroupCreateSchema, readValidatedJson } from "@/lib/server/requestSchemas";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await requireCoachAccess();
      if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const parsed = await readValidatedJson(request, coachGroupCreateSchema);
      if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
      const { name } = parsed.data;

      const group = await createCoachGroup(name, user);
      return NextResponse.json({ group });
    } catch (error) {
      logServerEvent({
        category: "coach",
        action: "group_create_failed",
        level: "error",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      return NextResponse.json({ error: "Création de groupe impossible." }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await requireCoachAccess();
      if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const groupId = Number(request.nextUrl.searchParams.get("groupId"));
      if (!Number.isInteger(groupId) || groupId <= 0) {
        return NextResponse.json({ error: "Groupe invalide." }, { status: 400 });
      }

      await deleteCoachGroup(groupId, user);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const groupId = Number(request.nextUrl.searchParams.get("groupId"));

      logServerEvent({
        category: "coach",
        action: "group_delete_failed",
        level: error instanceof Error && error.message === "Forbidden" ? "warn" : "error",
        meta: {
          groupId: Number.isInteger(groupId) ? groupId : undefined,
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
