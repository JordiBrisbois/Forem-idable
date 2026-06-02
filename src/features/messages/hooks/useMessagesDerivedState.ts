"use client";

import { useMemo } from "react";
import {
  ConversationPreview,
  DirectMessageTarget,
} from "@/types/messaging";

type UseMessagesDerivedStateParams = {
  contactQuery: string;
  contacts: DirectMessageTarget[];
  conversations: ConversationPreview[];
  selectedConversationId: number | null;
};

export function useMessagesDerivedState({
  contactQuery,
  contacts,
  conversations,
  selectedConversationId,
}: UseMessagesDerivedStateParams) {
  const selectedPreview = useMemo(
    () => conversations.find((entry) => entry.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const groupedConversations = useMemo(
    () => ({
      group: conversations.filter((entry) => entry.type === "group"),
      direct: conversations.filter((entry) => entry.type === "direct"),
    }),
    [conversations]
  );

  const filteredContacts = useMemo(() => {
    const normalizedQuery = contactQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return contacts;
    }

    return contacts.filter((contact) =>
      `${contact.firstName} ${contact.lastName} ${contact.email}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [contactQuery, contacts]);

  const unreadConversationCount = useMemo(
    () => conversations.reduce((total, conversation) => total + conversation.unreadCount, 0),
    [conversations]
  );

  return {
    selectedPreview,
    groupedConversations,
    filteredContacts,
    unreadConversationCount,
  };
}
