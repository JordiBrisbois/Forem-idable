import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { getUserPasswordHash, setUserPassword, verifyPassword } from "@/lib/server/auth";
import { passwordUpdateSchema } from "@/lib/server/requestSchemas";

export const PATCH = withSessionHandler(
  {
    access: "user",
    body: passwordUpdateSchema,
    fallbackMessage: "Mise à jour du mot de passe impossible.",
  },
  async ({ user, body }) => {
    const storedHash = await getUserPasswordHash(user.id);
    if (!storedHash || !verifyPassword(body.currentPassword, storedHash)) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });
    }

    await setUserPassword(user.id, body.password);
    return NextResponse.json({ ok: true });
  }
);
