import { ConversationDetail, ConversationMessage, ConversationPreview } from "@/types/messaging";

export function sortConversationPreviews(items: ConversationPreview[]) {
  return [...items].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "group" ? -1 : 1;
    }

    return new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime();
  });
}

export function patchConversationPreview(
  items: ConversationPreview[],
  message: {
    conversationId: number;
    createdAt: string;
    content: string | null;
    unreadDelta?: number;
    unreadCount?: number;
  }
) {
  const next = items.map((entry) =>
    entry.id === message.conversationId
      ? {
          ...entry,
          lastMessageAt: message.createdAt,
          lastMessagePreview: message.content,
          unreadCount:
            typeof message.unreadCount === "number"
              ? Math.max(0, message.unreadCount)
              : Math.max(0, entry.unreadCount + (message.unreadDelta ?? 0)),
        }
      : entry
  );

  return sortConversationPreviews(next);
}

export function markConversationPreviewAsRead(
  items: ConversationPreview[],
  conversationId: number
) {
  return items.map((entry) =>
    entry.id === conversationId
      ? {
          ...entry,
          unreadCount: 0,
        }
      : entry
  );
}

export function appendMessageToConversation(
  conversation: ConversationDetail | null,
  message: ConversationMessage,
  userId?: number
) {
  const normalizedMessage =
    userId && message.author?.userId !== null
      ? {
          ...message,
          isOwnMessage: message.author?.userId === userId,
        }
      : message;

  if (!conversation || conversation.id !== normalizedMessage.conversationId) {
    return conversation;
  }

  if (conversation.messages.some((entry) => entry.id === normalizedMessage.id)) {
    return conversation;
  }

  return {
    ...conversation,
    messages: [...conversation.messages, normalizedMessage],
  };
}
