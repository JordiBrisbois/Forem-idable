import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { createCoachGroup, deleteCoachGroup } from "@/lib/server/coach";
import { coachGroupCreateSchema } from "@/lib/server/requestSchemas";

export const POST = withSessionHandler(
  {
    access: "coach",
    body: coachGroupCreateSchema,
    fallbackMessage: "Création de classe impossible.",
  },
  async ({ user, body }) => NextResponse.json({ group: await createCoachGroup(body.name, user) })
);

export const DELETE = withSessionHandler(
  { access: "coach", fallbackMessage: "Suppression de la classe impossible." },
  async ({ request, user }) => {
    const groupId = Number(request.nextUrl.searchParams.get("groupId"));
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return NextResponse.json({ error: "Classe invalide." }, { status: 400 });
    }

    await deleteCoachGroup(groupId, user);
    return NextResponse.json({ ok: true });
  }
);
