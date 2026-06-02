"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { isSameDay } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { MessagesSquare, MessageSquareDashed } from "lucide-react";
import { MessageBubbleGroup } from "@/features/messages/components/MessageBubbleGroup";
import { DateSeparator } from "@/features/messages/components/DateSeparator";
import { UnreadMessagesBadge } from "@/features/messages/components/UnreadMessagesBadge";
import { MessageComposer } from "@/features/messages/components/MessageComposer";
import { groupMessagesByAuthor } from "@/features/messages/messages.utils";
import { cn } from "@/lib/utils";
import { Job } from "@/types/job";
import { ConversationDetail, ConversationMessage } from "@/types/messaging";

interface MessageThreadProps {
  conversation: ConversationDetail;
  error: string | null;
  isLoading: boolean;
  trackedJobIds: string[];
  draft: string;
  isSending: boolean;
  isMobile?: boolean;
  onTrackJob: (job: Job) => void;
  onDeleteMessage: (message: ConversationMessage) => void;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onScrollToBottom?: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageThread({
  conversation,
  error,
  isLoading,
  trackedJobIds,
  draft,
  isSending,
  isMobile,
  onTrackJob,
  onDeleteMessage,
  onDraftChange,
  onSend,
  onScrollToBottom,
  scrollAreaRef,
  bottomRef,
}: MessageThreadProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const prevMessagesLength = useRef(conversation.messages.length);
  const viewportRef = useRef<HTMLElement | null>(null);

  const messageGroups = useMemo(() => {
    return groupMessagesByAuthor(conversation.messages);
  }, [conversation.messages]);

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const near = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 200;
    setIsNearBottom(near);
    if (near) setUnreadCount(0);
  }, []);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>("[data-slot='scroll-area-viewport']");
    if (viewport) {
      viewportRef.current = viewport;
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }
  }, [scrollAreaRef, handleScroll]);

  useEffect(() => {
    const currentLength = conversation.messages.length;
    if (currentLength > prevMessagesLength.current) {
      const newMessages = currentLength - prevMessagesLength.current;
      if (isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      } else {
        setUnreadCount((c) => c + newMessages);
      }
    }
    prevMessagesLength.current = currentLength;
  }, [conversation.messages.length, isNearBottom, bottomRef]);

  if (error) {
    return (
      <Empty className="min-h-72 rounded-2xl border border-dashed border-border/60 bg-muted/10">
        <EmptyHeader>
          <EmptyMedia variant="icon"><MessageSquareDashed /></EmptyMedia>
          <EmptyTitle>Conversation indisponible.</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-3 py-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-24 animate-pulse rounded-3xl bg-muted",
              i % 2 === 0 ? "w-3/4" : "ml-auto w-2/3"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ScrollArea
        ref={scrollAreaRef}
        className={cn(
          "min-h-[220px] flex-1 px-3 py-3 sm:px-4 sm:py-4",
          isMobile && "min-h-0 px-2 py-2"
        )}
      >
        {conversation.messages.length === 0 ? (
          <Empty className="min-h-[320px] rounded-2xl border border-dashed border-border/60 bg-background/75">
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessagesSquare /></EmptyMedia>
              <EmptyTitle>Aucun message pour l&apos;instant.</EmptyTitle>
              <EmptyDescription>Envoie le premier message.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4 pb-1">
            {messageGroups.map((group, groupIndex) => {
              const firstMessage = group.messages[0];
              const prevGroup = messageGroups[groupIndex - 1];
              const showDate =
                !prevGroup ||
                !isSameDay(new Date(firstMessage.createdAt), new Date(prevGroup.messages[0].createdAt));

              return (
                <div key={`${group.authorKey}-${firstMessage.id}`} className="flex flex-col gap-1">
                  {showDate ? (
                    <DateSeparator date={new Date(firstMessage.createdAt)} />
                  ) : null}
                  <MessageBubbleGroup
                    group={group}
                    canModerateMessages={conversation.canModerateMessages}
                    trackedJobIds={trackedJobIds}
                    onTrackJob={onTrackJob}
                    onDeleteMessage={onDeleteMessage}
                    isMobile={isMobile}
                  />
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <UnreadMessagesBadge
        count={unreadCount}
        onClick={() => {
          setUnreadCount(0);
          bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          onScrollToBottom?.();
        }}
      />

      <MessageComposer
        draft={draft}
        isSending={isSending}
        onDraftChange={onDraftChange}
        onSend={onSend}
        inputId={isMobile ? "message-compose-mobile" : "message-compose"}
        isMobile={isMobile}
      />
    </div>
  );
}
