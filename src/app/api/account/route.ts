import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { updateUserProfile } from "@/lib/server/auth";
import { profileUpdateSchema } from "@/lib/server/requestSchemas";

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Compte indisponible." },
  async ({ user }) => NextResponse.json({ user })
);

export const PATCH = withSessionHandler(
  {
    access: "user",
    body: profileUpdateSchema,
    fallbackMessage: "Mise à jour du profil impossible.",
  },
  async ({ user, body }) => {
    await updateUserProfile(user.id, body.firstName, body.lastName);
    return NextResponse.json({
      user: { ...user, firstName: body.firstName, lastName: body.lastName },
    });
  }
);
