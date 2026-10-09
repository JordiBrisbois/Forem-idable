import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { addUserToCoachGroup, removeUserFromCoachGroup } from "@/lib/server/coach";
import { positiveIntegerBodySchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const POST = withSessionHandler(
  {
    access: "coach",
    body: positiveIntegerBodySchema,
    fallbackMessage: "Ajout à la classe impossible.",
  },
  async ({ user, body, params }) => {
    const groupId = parseRouteId(params.groupId as string);
    if (!groupId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await addUserToCoachGroup(groupId, body.userId, user);
    return NextResponse.json({ ok: true });
  }
);

export const DELETE = withSessionHandler(
  { access: "coach", fallbackMessage: "Suppression de la classe impossible." },
  async ({ request, user, params }) => {
    const groupId = parseRouteId(params.groupId as string);
    const userId = Number(request.nextUrl.searchParams.get("userId"));
    if (!groupId || !Number.isInteger(userId)) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await removeUserFromCoachGroup(groupId, userId, user);
    return NextResponse.json({ ok: true });
  }
);
