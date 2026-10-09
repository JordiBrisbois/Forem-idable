import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { createCoachAccount } from "@/lib/server/accounts";
import { setUserRole } from "@/lib/server/coach";
import { adminCoachCreateBodySchema } from "@/lib/server/requestSchemas";

export const POST = withSessionHandler(
  {
    access: "admin",
    body: adminCoachCreateBodySchema,
    fallbackMessage: "Création du coach impossible.",
  },
  async ({ user, body }) => {
    if ("userId" in body) {
      await setUserRole(body.userId, "coach", user.id);
      return NextResponse.json({ ok: true });
    }

    const { user: created, temporaryPassword } = await createCoachAccount(user, body);
    return NextResponse.json({ ok: true, user: created, temporaryPassword });
  }
);

export const DELETE = withSessionHandler(
  { access: "admin", fallbackMessage: "Retrait du rôle coach impossible." },
  async ({ request, user }) => {
    const userId = Number(request.nextUrl.searchParams.get("userId"));
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    await setUserRole(userId, "user", user.id);
    return NextResponse.json({ ok: true });
  }
);
