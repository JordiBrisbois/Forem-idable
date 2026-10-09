import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { setCoachGroupManager } from "@/lib/server/coach";
import { positiveIntegerBodySchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const PUT = withSessionHandler(
  {
    access: "admin",
    body: positiveIntegerBodySchema,
    fallbackMessage: "Définition du manager impossible.",
  },
  async ({ user, body, params }) => {
    const groupId = parseRouteId(params.groupId as string);
    if (!groupId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await setCoachGroupManager(groupId, body.userId, user);
    return NextResponse.json({ ok: true });
  }
);
