import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { publishConversationEvent } from "@/lib/server/messageEvents";
import { deleteConversationMessage } from "@/lib/server/messaging";
import { parseIntegerParam } from "@/lib/server/requestSchemas";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string; messageId: string }> }
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
    const messageId = parseIntegerParam(params.messageId);
    if (!conversationId || !messageId) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    const message = await deleteConversationMessage(user, conversationId, messageId);
    await publishConversationEvent(conversationId, {
      type: "conversation.message_deleted",
      conversationId,
      messageId,
    });

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "NotFound") {
      return NextResponse.json({ error: "Message introuvable." }, { status: 404 });
    }

    return NextResponse.json({ error: "Suppression du message impossible." }, { status: 500 });
  }
}
