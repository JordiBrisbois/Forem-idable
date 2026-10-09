import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { addCoachToGroup, removeCoachFromGroup } from "@/lib/server/coach";
import { positiveIntegerBodySchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const POST = withSessionHandler(
  {
    access: "coach",
    body: positiveIntegerBodySchema,
    fallbackMessage: "Attribution du coach impossible.",
  },
  async ({ user, body, params }) => {
    const groupId = parseRouteId(params.groupId as string);
    if (!groupId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await addCoachToGroup(groupId, body.userId, user);
    return NextResponse.json({ ok: true });
  }
);

export const DELETE = withSessionHandler(
  { access: "coach", fallbackMessage: "Retrait du coach impossible." },
  async ({ request, user, params }) => {
    const groupId = parseRouteId(params.groupId as string);
    const userId = Number(request.nextUrl.searchParams.get("userId"));
    if (!groupId || !Number.isInteger(userId)) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await removeCoachFromGroup(groupId, userId, user);
    return NextResponse.json({ ok: true });
  }
);
