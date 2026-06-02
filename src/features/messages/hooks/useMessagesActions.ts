"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { Dispatch, SetStateAction } from "react";
import { Job } from "@/types/job";
import { ConversationDetail, ConversationMessage, ConversationPreview, DirectMessageTarget } from "@/types/messaging";
import {
  closeDirectMessageConversation,
  createDirectMessageConversation,
  createTrackedApplication,
  postConversationMessage,
  removeConversationMessage,
} from "@/features/messages/messages.api";
import { patchConversationPreview } from "@/features/messages/messages.state";

type UseMessagesActionsInput = {
  conversations: ConversationPreview[];
  selectedConversation: ConversationDetail | null;
  selectedConversationId: number | null;
  draft: string;
  messagePendingDeletion: ConversationMessage | null;
  scheduleScrollThreadToBottom: (behavior?: ScrollBehavior) => void;
  loadConversationDetail: (
    conversationId: number,
    options?: { markAsRead?: boolean; silent?: boolean }
  ) => Promise<void>;
  loadConversations: (
    preferredConversationId?: number | null,
    options?: { silent?: boolean }
  ) => Promise<number | null | undefined>;
  syncConversationListPreview: (message: {
    conversationId: number;
    createdAt: string;
    content: string | null;
    unreadDelta?: number;
    unreadCount?: number;
  }) => void;
  setConversations: Dispatch<SetStateAction<ConversationPreview[]>>;
  setSelectedConversation: Dispatch<SetStateAction<ConversationDetail | null>>;
  setSelectedConversationId: Dispatch<SetStateAction<number | null>>;
  setTrackedJobIds: Dispatch<SetStateAction<string[]>>;
  setDraft: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setContactsError: Dispatch<SetStateAction<string | null>>;
  setIsDirectDialogOpen: Dispatch<SetStateAction<boolean>>;
  setIsMobileConversationOpen: Dispatch<SetStateAction<boolean>>;
  setMessagePendingDeletion: Dispatch<SetStateAction<ConversationMessage | null>>;
  setIsSending: Dispatch<SetStateAction<boolean>>;
  setIsDeletingMessage: Dispatch<SetStateAction<boolean>>;
  setIsClosingDirectConversation: Dispatch<SetStateAction<boolean>>;
};

export function useMessagesActions({
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
}: UseMessagesActionsInput) {
  const sendCurrentMessage = useCallback(async () => {
    if (!selectedConversation || !draft.trim()) return;

    const normalizedDraft = draft.trim();
    if (normalizedDraft === "/clean") {
      if (selectedConversation.type !== "group") {
        toast.error("`/clean` est réservé aux conversations de groupe.");
        return;
      }

      if (!selectedConversation.canModerateMessages) {
        toast.error("Tu n'as pas les droits pour nettoyer cette conversation.");
        return;
      }
    }

    setIsSending(true);
    setError(null);

    try {
      const { data } = await postConversationMessage(
        selectedConversation.id,
        normalizedDraft
      );

      if (data.cleared) {
        setDraft("");
        setSelectedConversation((current) =>
          current && current.id === selectedConversation.id
            ? {
                ...current,
                messages: [],
              }
            : current
        );
        setConversations((current) =>
          current.map((entry) =>
            entry.id === selectedConversation.id
              ? {
                  ...entry,
                  lastMessagePreview: null,
                }
              : entry
          )
        );
        toast.success("Conversation nettoyée.");
        return;
      }

      if (!data.message) {
        throw new Error("Envoi du message impossible.");
      }

      setDraft("");
      setSelectedConversation((current) =>
        current && current.id === data.message?.conversationId
          ? {
              ...current,
              messages: [...current.messages, data.message],
            }
          : current
      );
      syncConversationListPreview({
        conversationId: data.message.conversationId,
        createdAt: data.message.createdAt,
        content: data.message.content,
      });
      scheduleScrollThreadToBottom();
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Envoi du message impossible.";
      if (normalizedDraft === "/clean") {
        toast.error(message);
      } else {
        setError(message);
      }
    } finally {
      setIsSending(false);
    }
  }, [
    draft,
    scheduleScrollThreadToBottom,
    selectedConversation,
    setConversations,
    setDraft,
    setError,
    setIsSending,
    setSelectedConversation,
    syncConversationListPreview,
  ]);

  const addSharedJobToApplications = useCallback(async (job: Job) => {
    try {
      await createTrackedApplication(job);

      setTrackedJobIds((current) => (current.includes(job.id) ? current : [...current, job.id]));
      toast.success("Offre ajoutée au suivi.");
    } catch (trackedJobError) {
      toast.error(
        trackedJobError instanceof Error
          ? trackedJobError.message
          : "Impossible d'ajouter la candidature."
      );
    }
  }, [setTrackedJobIds]);

  const deleteSelectedMessage = useCallback(async () => {
    if (!selectedConversation || !messagePendingDeletion) return;

    setIsDeletingMessage(true);
    try {
      const { data } = await removeConversationMessage(
        selectedConversation.id,
        messagePendingDeletion.id
      );

      if (data.message) {
        setSelectedConversation((current) =>
          current && current.id === selectedConversation.id
            ? {
                ...current,
                messages: current.messages.map((message) =>
                  message.id === data.message?.id ? data.message : message
                ),
              }
            : current
        );
      } else {
        setSelectedConversation((current) =>
          current && current.id === selectedConversation.id
            ? {
                ...current,
                messages: current.messages.filter(
                  (message) => message.id !== messagePendingDeletion.id
                ),
              }
            : current
        );
      }

      setMessagePendingDeletion(null);
      await loadConversations(selectedConversation.id, { silent: true });
      toast.success("Message supprimé.");
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Suppression du message impossible."
      );
    } finally {
      setIsDeletingMessage(false);
    }
  }, [
    loadConversations,
    messagePendingDeletion,
    selectedConversation,
    setIsDeletingMessage,
    setMessagePendingDeletion,
    setSelectedConversation,
  ]);

  const closeSelectedDirectConversation = useCallback(async () => {
    if (!selectedConversationId) {
      return;
    }

    setIsClosingDirectConversation(true);
    setError(null);

    try {
      await closeDirectMessageConversation(selectedConversationId);

      const remaining = conversations.filter((entry) => entry.id !== selectedConversationId);
      const nextConversationId = remaining[0]?.id ?? null;

      setConversations(remaining);
      setSelectedConversationId(nextConversationId);
      setSelectedConversation(null);
      setIsMobileConversationOpen(false);

      if (nextConversationId) {
        await loadConversationDetail(nextConversationId, { markAsRead: true });
      }
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "Fermeture du DM impossible.");
    } finally {
      setIsClosingDirectConversation(false);
    }
  }, [
    conversations,
    loadConversationDetail,
    selectedConversationId,
    setConversations,
    setError,
    setIsClosingDirectConversation,
    setIsMobileConversationOpen,
    setSelectedConversation,
    setSelectedConversationId,
  ]);

  const createDirectConversation = useCallback(
    async (contact: DirectMessageTarget) => {
      setContactsError(null);
      setIsDirectDialogOpen(false);

      try {
        const { data } = await createDirectMessageConversation(contact.userId);

        if (!data.conversation) {
          throw new Error("Création du DM impossible.");
        }

        setSelectedConversation(data.conversation);
        setSelectedConversationId(data.conversation.id);
        setConversations((current) =>
          patchConversationPreview(current, {
            conversationId: data.conversation!.id,
            createdAt: data.conversation!.lastMessageAt,
            content: data.conversation!.lastMessagePreview,
            unreadCount: 0,
          })
        );
        await loadConversations(data.conversation.id, { silent: true });
        setIsMobileConversationOpen(true);
      } catch (directError) {
        setIsDirectDialogOpen(true);
        setContactsError(
          directError instanceof Error ? directError.message : "Création du DM impossible."
        );
      }
    },
    [
      loadConversations,
      setContactsError,
      setConversations,
      setIsDirectDialogOpen,
      setIsMobileConversationOpen,
      setSelectedConversation,
      setSelectedConversationId,
    ]
  );

  return {
    sendCurrentMessage,
    addSharedJobToApplications,
    deleteSelectedMessage,
    closeSelectedDirectConversation,
    createDirectConversation,
  };
}
