import { checkRateLimit } from "@/lib/server/rateLimit";
import { getCurrentUser } from "@/lib/server/auth";
import { subscribeMessageEvents } from "@/lib/server/messageEvents";
import { MessageStreamEvent } from "@/types/messaging";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function encodeSseMessage(event: MessageStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit({
    scope: "message-stream",
    limit: 5,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(heartbeatId);
        unsubscribe();
        controller.close();
      };

      const send = (event: MessageStreamEvent) => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(encodeSseMessage(event)));
      };

      const unsubscribe = subscribeMessageEvents(user.id, send);
      const heartbeatId = setInterval(() => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 25000);

      controller.enqueue(
        encoder.encode(
          encodeSseMessage({
            type: "stream.connected",
            connectedAt: new Date().toISOString(),
          })
        )
      );

      request.signal.addEventListener("abort", close);
    },
    cancel() {
      // Browser-initiated close is already handled via request abort.
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
