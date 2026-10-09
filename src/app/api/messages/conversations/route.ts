import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { listVisibleConversations } from "@/lib/server/messaging";

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Chargement des conversations impossible." },
  async ({ user }) => NextResponse.json({ conversations: await listVisibleConversations(user) })
);
