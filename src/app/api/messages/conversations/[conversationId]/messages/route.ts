import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { publishConversationEvent } from "@/lib/server/messageEvents";
import { sendTextMessage } from "@/lib/server/messaging";
import { sendConversationMessageSchema } from "@/lib/server/messagingSchemas";
import { parseIntegerParam } from "@/lib/server/requestSchemas";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { checkRateLimit } from "@/lib/server/rateLimit";

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

    const rateLimit = await checkRateLimit({
      scope: "messages-send",
      limit: 60,
      windowMs: 60 * 1000,
      identifier: String(user.id),
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de messages envoyés. Veuillez patienter." },
        { status: 429 }
      );
    }

    const params = await context.params;
    const conversationId = parseIntegerParam(params.conversationId);
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation invalide." }, { status: 400 });
    }

    const body = sendConversationMessageSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Message invalide." }, { status: 400 });
    }

    const result = await sendTextMessage(user, conversationId, body.data.content);
    if ("cleared" in result) {
      await publishConversationEvent(conversationId, {
        type: "conversation.cleared",
        conversationId,
      });
      return NextResponse.json({ cleared: true });
    }

    await publishConversationEvent(conversationId, {
      type: "conversation.message_created",
      conversationId,
      messageId: result.id,
      message: result,
    });

    return NextResponse.json({ message: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Envoi du message impossible." },
      { status: 500 }
    );
  }
}
