"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ConversationDetail,
  ConversationMessage,
  ConversationPreview,
  DirectMessageTarget,
} from "@/types/messaging";
import { patchConversationPreview, appendMessageToConversation, markConversationPreviewAsRead as markPreviewRead } from "@/features/messages/messages.state";
import { useMessagesDataLoader } from "@/features/messages/hooks/useMessagesDataLoader";
import { useMessagesDerivedState } from "@/features/messages/hooks/useMessagesDerivedState";
import { useMessagesActions } from "@/features/messages/hooks/useMessagesActions";
import { useMessageThreadScroll } from "@/features/messages/hooks/useMessageThreadScroll";
import { useMessagesStream } from "@/features/messages/hooks/useMessagesStream";
import { useMessagesStreamHandler } from "@/features/messages/hooks/useMessagesStreamHandler";

export function useMessagesPageState() {
  const { user } = useAuth();
  const isMobileViewport = useIsMobile();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [hasMessagingAccess, setHasMessagingAccess] = useState<boolean | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationDetail | null>(null);
  const [contacts, setContacts] = useState<DirectMessageTarget[]>([]);
  const [trackedJobIds, setTrackedJobIds] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactQuery, setContactQuery] = useState("");
  const [conversationQuery, setConversationQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [isDirectDialogOpen, setIsDirectDialogOpen] = useState(false);
  const [isClosingDirectConversation, setIsClosingDirectConversation] = useState(false);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const [messagePendingDeletion, setMessagePendingDeletion] =
    useState<ConversationMessage | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const conversationsRef = useRef<ConversationPreview[]>([]);
  const selectedConversationIdRef = useRef<number | null>(null);
  const selectedConversationRef = useRef<ConversationDetail | null>(null);
  const {
    desktopThreadBottomRef,
    desktopThreadScrollAreaRef,
    mobileThreadBottomRef,
    mobileThreadScrollAreaRef,
    scheduleScrollThreadToBottom,
  } = useMessageThreadScroll(isMobileViewport);
  const {
    selectedPreview,
    groupedConversations,
    filteredContacts,
    unreadConversationCount,
  } = useMessagesDerivedState({
    contactQuery,
    contacts,
    conversations,
    selectedConversationId,
  });

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const {
    loadConversations,
    loadConversationDetail,
    loadContacts,
    loadTrackedApplications,
  } = useMessagesDataLoader({
    setConversations,
    setHasMessagingAccess,
    setSelectedConversationId,
    setSelectedConversation,
    setTrackedJobIds,
    setContacts,
    setError,
    setContactsError,
    setIsConversationLoading,
    setIsContactsLoading,
  });

  const syncConversationListPreview = useCallback(
    (message: {
      conversationId: number;
      createdAt: string;
      content: string | null;
      unreadDelta?: number;
      unreadCount?: number;
    }) => {
      setConversations((current) => patchConversationPreview(current, message));
    },
    []
  );

  const appendMessageToSelectedConversation = useCallback(
    (message: ConversationMessage) => {
      setSelectedConversation((current) => appendMessageToConversation(current, message, user?.id));
    },
    [user]
  );

  const markConversationPreviewAsRead = useCallback((conversationId: number) => {
    setConversations((current) => markPreviewRead(current, conversationId));
  }, []);

  const openConversation = useCallback(
    (conversationId: number) => {
      setSelectedConversationId(conversationId);
      setIsMobileConversationOpen(true);
      setConversations((current) =>
        current.map((entry) =>
          entry.id === conversationId
            ? {
                ...entry,
                unreadCount: 0,
              }
            : entry
        )
      );
      void (async () => {
        await loadConversationDetail(conversationId, { markAsRead: true });
        await loadConversations(conversationId, { silent: true });
        scheduleScrollThreadToBottom("auto");
      })();
    },
    [loadConversationDetail, loadConversations, scheduleScrollThreadToBottom]
  );

  const {
    sendCurrentMessage,
    addSharedJobToApplications,
    deleteSelectedMessage,
    closeSelectedDirectConversation,
    createDirectConversation,
  } = useMessagesActions({
    conversations,
    selectedConversation,
    selectedConversationId,
    draft,
    messagePendingDeletion,
    scheduleScrollThreadToBottom,
    loadConversationDetail,
    loadConversations,
    syncConversationListPreview,
    setConversations,
    setSelectedConversation,
    setSelectedConversationId,
    setTrackedJobIds,
    setDraft,
    setError,
    setContactsError,
    setIsDirectDialogOpen,
    setIsMobileConversationOpen,
    setMessagePendingDeletion,
    setIsSending,
    setIsDeletingMessage,
    setIsClosingDirectConversation,
  });

  const handleStreamEvent = useMessagesStreamHandler({
    userId: user?.id,
    conversationsRef,
    selectedConversationIdRef,
    selectedConversationRef,
    loadConversations,
    loadConversationDetail,
    syncConversationListPreview,
    appendMessageToSelectedConversation,
    markConversationPreviewAsRead,
    scheduleScrollThreadToBottom,
  });

  useMessagesStream({
    enabled: !isLoading && hasMessagingAccess !== false,
    onEvent: handleStreamEvent,
  });

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setIsLoading(true);
      try {
        const [nextConversationId] = await Promise.all([
          loadConversations(),
          loadTrackedApplications(),
        ]);
        if (!cancelled && nextConversationId) {
          await loadConversationDetail(nextConversationId, { markAsRead: true });
          await loadConversations(nextConversationId, { silent: true });
          scheduleScrollThreadToBottom("auto");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Chargement des conversations impossible."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, [loadConversationDetail, loadConversations, loadTrackedApplications, scheduleScrollThreadToBottom]);

  useEffect(() => {
    if (!isDirectDialogOpen) {
      return;
    }

    const controller = new AbortController();
    setContactsError(null);
    setContactQuery("");
    void loadContacts({ silent: false, signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [isDirectDialogOpen, loadContacts]);

  // Scroll to bottom only when explicitly opening a conversation, not on every new message.
  // MessageThread handles conditional scroll for incoming messages and the "new messages" badge.

  useEffect(() => {
    if (!isMobileConversationOpen || !selectedConversationId) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
    scheduleScrollThreadToBottom("auto");
  }, [isMobileConversationOpen, scheduleScrollThreadToBottom, selectedConversationId]);

  useEffect(() => {
    if (!isMobileConversationOpen || window.innerWidth >= 768) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileConversationOpen]);

  useEffect(() => {
    if (!selectedConversationId) {
      setIsMobileConversationOpen(false);
    }
  }, [selectedConversationId]);

  return {
    contacts,
    contactQuery,
    contactsError,
    conversations,
    conversationQuery,
    draft,
    error,
    filteredContacts,
    groupedConversations,
    hasMessagingAccess,
    isClosingDirectConversation,
    isContactsLoading,
    isConversationLoading,
    isDeletingMessage,
    isDirectDialogOpen,
    isLoading,
    isMobileConversationOpen,
    isSending,
    messagePendingDeletion,
    selectedConversation,
    selectedConversationId,
    selectedPreview,
    desktopThreadBottomRef,
    desktopThreadScrollAreaRef,
    trackedJobIds,
    unreadConversationCount,
    mobileThreadBottomRef,
    mobileThreadScrollAreaRef,
    addSharedJobToApplications,
    closeSelectedDirectConversation,
    createDirectConversation,
    deleteSelectedMessage,
    openConversation,
    sendCurrentMessage,
    setContactQuery,
    setConversationQuery,
    setDraft,
    setIsDirectDialogOpen,
    setIsMobileConversationOpen,
    setMessagePendingDeletion,
  };
}

export type MessagesPageState = ReturnType<typeof useMessagesPageState>;
