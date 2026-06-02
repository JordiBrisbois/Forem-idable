"use client";

import { useCallback } from "react";
import type { MutableRefObject } from "react";
import {
  ConversationDetail,
  ConversationMessage,
  ConversationPreview,
  MessageStreamEvent,
} from "@/types/messaging";

type UseMessagesStreamHandlerInput = {
  userId?: number;
  conversationsRef: MutableRefObject<ConversationPreview[]>;
  selectedConversationIdRef: MutableRefObject<number | null>;
  selectedConversationRef: MutableRefObject<ConversationDetail | null>;
  loadConversations: (
    preferredConversationId?: number | null,
    options?: { silent?: boolean }
  ) => Promise<number | null | undefined>;
  loadConversationDetail: (
    conversationId: number,
    options?: { markAsRead?: boolean; silent?: boolean }
  ) => Promise<void>;
  syncConversationListPreview: (message: {
    conversationId: number;
    createdAt: string;
    content: string | null;
    unreadDelta?: number;
    unreadCount?: number;
  }) => void;
  appendMessageToSelectedConversation: (message: ConversationMessage) => void;
  markConversationPreviewAsRead: (conversationId: number) => void;
  scheduleScrollThreadToBottom: (behavior?: ScrollBehavior) => void;
};

export function useMessagesStreamHandler({
  userId,
  conversationsRef,
  selectedConversationIdRef,
  selectedConversationRef,
  loadConversations,
  loadConversationDetail,
  syncConversationListPreview,
  appendMessageToSelectedConversation,
  markConversationPreviewAsRead,
  scheduleScrollThreadToBottom,
}: UseMessagesStreamHandlerInput) {
  return useCallback(
    (event: MessageStreamEvent) => {
      if (event.type === "stream.connected") {
        return;
      }

      const openConversationId =
        selectedConversationRef.current?.id ?? selectedConversationIdRef.current;

      if (event.type === "conversation.message_created") {
        const authorUserId = event.message.author?.userId ?? null;
        const isOwnMessage =
          userId && authorUserId !== null ? authorUserId === userId : event.message.isOwnMessage;
        const conversationExists = conversationsRef.current.some(
          (entry) => entry.id === event.conversationId
        );

        syncConversationListPreview({
          conversationId: event.message.conversationId,
          createdAt: event.message.createdAt,
          content: event.message.content,
          unreadCount: openConversationId === event.conversationId || isOwnMessage ? 0 : undefined,
          unreadDelta: openConversationId === event.conversationId || isOwnMessage ? 0 : 1,
        });

        if (openConversationId === event.conversationId) {
          appendMessageToSelectedConversation(event.message);
          markConversationPreviewAsRead(event.conversationId);
          scheduleScrollThreadToBottom("auto");
          return;
        }

        if (!conversationExists) {
          void loadConversations(openConversationId ?? event.conversationId, { silent: true });
        }

        return;
      }

      void (async () => {
        const preferredConversationId =
          openConversationId === event.conversationId
            ? openConversationId
            : openConversationId ?? event.conversationId;

        await loadConversations(preferredConversationId, { silent: true });

        if (openConversationId === event.conversationId) {
          await loadConversationDetail(event.conversationId, {
            markAsRead: true,
            silent: true,
          });

          if (event.type === "conversation.cleared") {
            scheduleScrollThreadToBottom("auto");
          }
        }
      })();
    },
    [
      appendMessageToSelectedConversation,
      conversationsRef,
      loadConversationDetail,
      loadConversations,
      markConversationPreviewAsRead,
      scheduleScrollThreadToBottom,
      selectedConversationIdRef,
      selectedConversationRef,
      syncConversationListPreview,
      userId,
    ]
  );
}
