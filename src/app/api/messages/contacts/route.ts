import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { listDirectMessageTargets } from "@/lib/server/messaging";

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Chargement des contacts impossible." },
  async ({ user }) => NextResponse.json({ contacts: await listDirectMessageTargets(user) })
);
