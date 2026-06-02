import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { closeDirectConversation } from "@/lib/server/messaging";
import { parseIntegerParam } from "@/lib/server/requestSchemas";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = await context.params;
    const conversationId = parseIntegerParam(params.conversationId);
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation invalide." }, { status: 400 });
    }

    await closeDirectConversation(user, conversationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "InvalidConversationType") {
      return NextResponse.json({ error: "Cette conversation ne peut pas être fermée." }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Fermeture du DM impossible." },
      { status: 500 }
    );
  }
}
