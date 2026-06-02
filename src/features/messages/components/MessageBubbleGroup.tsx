"use client";

import { MessageBubble } from "@/features/messages/components/MessageBubble";
import { ConversationMessage } from "@/types/messaging";
import { Job } from "@/types/job";
import { cn } from "@/lib/utils";

interface MessageBubbleGroupProps {
  group: {
    authorKey: string;
    authorName: string;
    isOwnMessage: boolean;
    messages: ConversationMessage[];
  };
  canModerateMessages: boolean;
  trackedJobIds: string[];
  onTrackJob: (job: Job) => void;
  onDeleteMessage: (message: ConversationMessage) => void;
  isMobile?: boolean;
}

export function MessageBubbleGroup({
  group,
  canModerateMessages,
  trackedJobIds,
  onTrackJob,
  onDeleteMessage,
  isMobile,
}: MessageBubbleGroupProps) {
  return (
    <div className={cn("flex flex-col gap-1", isMobile && "gap-0.5")}>
      {group.messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          canModerateMessages={canModerateMessages}
          trackedJobIds={trackedJobIds}
          onTrackJob={onTrackJob}
          onDeleteMessage={onDeleteMessage}
          isMobile={isMobile}
          showAuthor={index === 0}
        />
      ))}
    </div>
  );
}
