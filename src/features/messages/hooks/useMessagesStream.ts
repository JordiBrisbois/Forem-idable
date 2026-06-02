"use client";

import { useEffect, useEffectEvent } from "react";
import { MessageStreamEvent } from "@/types/messaging";

export function useMessagesStream({
  enabled,
  onEvent,
}: {
  enabled: boolean;
  onEvent: (event: MessageStreamEvent) => void;
}) {
  const handleEvent = useEffectEvent(onEvent);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const source = new EventSource("/api/messages/stream");

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as MessageStreamEvent;
        handleEvent(parsed);
      } catch {
        // Ignore malformed event payloads and keep the stream alive.
      }
    };

    source.onerror = () => {
      // Let EventSource handle reconnection automatically.
    };

    return () => {
      source.close();
    };
  }, [enabled]);
}
