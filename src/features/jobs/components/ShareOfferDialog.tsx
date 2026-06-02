"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { getJobExternalUrl } from "@/features/jobs/utils/jobLinks";
import { Job } from "@/types/job";
import { ConversationPreview, DirectMessageTarget } from "@/types/messaging";
import {
  fetchConversations,
  fetchMessageContacts,
  postConversationMessage,
  shareDirectMessage,
} from "@/features/messages/messages.api";
import { getDisplayName } from "@/features/messages/messages.utils";
import { MessagesSquare, UserRound } from "lucide-react";

export function ShareOfferDialog({
  job,
  open,
  onOpenChange,
}: {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [contacts, setContacts] = useState<DirectMessageTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    void Promise.all([fetchConversations(), fetchMessageContacts()])
      .then(([conversationResult, contactsResult]) => {
        if (!isMounted) return;

        const nextConversations = Array.isArray(conversationResult.data?.conversations)
          ? conversationResult.data.conversations
          : [];
        const nextContacts = Array.isArray(contactsResult.data?.contacts)
          ? contactsResult.data.contacts
          : [];

        setConversations(nextConversations);
        setContacts(nextContacts);

        if (!conversationResult.response.ok && !contactsResult.response.ok) {
          setError("Partage indisponible pour le moment.");
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Partage indisponible pour le moment.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  const filteredGroupConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const groups = conversations.filter((conversation) => conversation.type === "group");

    if (!normalizedQuery) {
      return groups;
    }

    return groups.filter((conversation) =>
      `${conversation.title} ${conversation.subtitle ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [conversations, query]);

  const filteredContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return contacts;
    }

    return contacts.filter((contact) =>
      `${contact.firstName} ${contact.lastName} ${contact.email} ${contact.relationLabel}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [contacts, query]);

  const sendToConversation = async (conversationId: number) => {
    if (!job || isSharing) return;

    const shareUrl = getJobExternalUrl(job);
    setIsSharing(true);
    try {
      await postConversationMessage(conversationId, shareUrl);

      toast.success("Offre partagée dans la conversation.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de partager cette offre.");
    } finally {
      setIsSharing(false);
    }
  };

  const sendAsDirectMessage = async (targetUserId: number) => {
    if (!job || isSharing) return;

    const shareUrl = getJobExternalUrl(job);
    setIsSharing(true);
    try {
      await shareDirectMessage(targetUserId, shareUrl);

      toast.success("Offre envoyée en message privé.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Impossible d'envoyer cette offre en privé."
      );
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Partager une offre"
      description="Choisis une conversation de groupe ou une personne autorisée."
      className="sm:max-w-2xl"
    >
      <CommandInput placeholder="Rechercher une conversation ou une personne..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>
          {isLoading
            ? "Chargement..."
            : error
              ? error
              : "Aucune conversation ou personne disponible."}
        </CommandEmpty>

        {!isLoading && filteredGroupConversations.length > 0 ? (
          <CommandGroup heading="Conversations de groupe">
            {filteredGroupConversations.map((conversation) => (
              <CommandItem
                key={`group-${conversation.id}`}
                value={`${conversation.title} ${conversation.subtitle ?? ""}`}
                onSelect={() => {
                  void sendToConversation(conversation.id);
                }}
                disabled={isSharing}
              >
                <MessagesSquare />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium">{conversation.title}</span>
                  {conversation.subtitle ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {conversation.subtitle}
                    </span>
                  ) : null}
                </div>
                <CommandShortcut>Groupe</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {!isLoading && filteredGroupConversations.length > 0 && filteredContacts.length > 0 ? (
          <CommandSeparator />
        ) : null}

        {!isLoading && filteredContacts.length > 0 ? (
          <CommandGroup heading="Messages privés">
            {filteredContacts.map((contact) => {
              const displayName = getDisplayName({
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                fallback: "Contact",
              });

              return (
                <CommandItem
                  key={`contact-${contact.userId}`}
                  value={`${displayName} ${contact.email} ${contact.relationLabel}`}
                  onSelect={() => {
                    void sendAsDirectMessage(contact.userId);
                  }}
                  disabled={isSharing}
                >
                  <UserRound />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {contact.email} • {contact.relationLabel}
                    </span>
                  </div>
                  <CommandShortcut>DM</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
