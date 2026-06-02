"use client";

import { useState } from "react";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getDisplayName, getInitials, stringToHslBackground, stringToHslForeground } from "@/features/messages/messages.utils";
import { SharedJobCard } from "@/features/messages/components/SharedJobCard";
import { cn } from "@/lib/utils";
import { Job } from "@/types/job";
import { ConversationMessage } from "@/types/messaging";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MessageBubbleProps {
  message: ConversationMessage;
  canModerateMessages: boolean;
  trackedJobIds: string[];
  onTrackJob: (job: Job) => void;
  onDeleteMessage: (message: ConversationMessage) => void;
  isMobile?: boolean;
  showAuthor?: boolean;
}

export function MessageBubble({
  message,
  canModerateMessages,
  trackedJobIds,
  onTrackJob,
  onDeleteMessage,
  isMobile,
  showAuthor = true,
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const displayName = message.author
    ? getDisplayName({
        firstName: message.author.firstName,
        lastName: message.author.lastName,
        email: message.author.email,
        fallback: "Message",
      })
    : "Système";
  const sharedJob =
    message.type === "job_share" && message.metadata.sharedJob
      ? message.metadata.sharedJob
      : null;
  const isTracked = sharedJob ? trackedJobIds.includes(sharedJob.id) : false;
  const authorColor = message.author ? stringToHslBackground(displayName) : undefined;
  const authorFg = message.author ? stringToHslForeground(displayName) : undefined;
  const showActions = (message.isOwnMessage || canModerateMessages) && !message.deletedAt;

  return (
    <div
      className={cn("flex gap-2.5", isMobile && "gap-2", message.isOwnMessage ? "justify-end" : "justify-start")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!message.isOwnMessage && showAuthor ? (
        <Avatar
          className="mt-0.5 shrink-0 border border-border/60"
          style={{ backgroundColor: authorColor }}
        >
          <AvatarFallback style={{ color: authorFg }}>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      ) : !message.isOwnMessage ? (
        <div className="w-8 shrink-0" aria-hidden="true" />
      ) : null}

      <div className={cn("relative min-w-0 max-w-[92%] rounded-2xl border px-3.5 py-2.5 shadow-sm lg:max-w-[78%]",
        isMobile && "max-w-[96%] rounded-[1.4rem] px-3 py-2.5",
        message.isOwnMessage
          ? "border-primary/20 bg-primary/8"
          : "border-border/50 bg-background"
      )}>
        {showActions ? (
          <div className={cn(
            "absolute -top-2 right-2 z-10 transition-opacity",
            isMobile ? "opacity-100" : isHovered ? "opacity-100" : "opacity-0"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="secondary" size="icon" className="size-7 rounded-full shadow-sm">
                  <EllipsisVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteMessage(message)}
                >
                  <Trash2 className="size-3.5" />
                  {message.isOwnMessage && !canModerateMessages
                    ? "Supprimer pour moi"
                    : "Supprimer"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        {(showAuthor || !message.isOwnMessage) && (
          <div className="flex flex-wrap items-center gap-2 pr-6">
            {!message.isOwnMessage || !isMobile ? (
              <p className="text-sm font-medium break-words">{displayName}</p>
            ) : null}
            <span className={cn("text-[11px] text-muted-foreground", isMobile && "text-[10px]")}>
              {format(new Date(message.createdAt), "dd/MM HH:mm", { locale: fr })}
            </span>
            {message.editedAt ? <Badge variant="outline" className="text-[10px]">modifié</Badge> : null}
          </div>
        )}

        {message.deletedAt ? (
          <p className={cn("mt-2 text-sm italic text-muted-foreground", isMobile && "mt-1.5")}>
            Message supprimé.
          </p>
        ) : message.content ? (
          <p className={cn("mt-2 text-sm leading-relaxed whitespace-pre-wrap", isMobile && "mt-1.5 text-[0.95rem] leading-6")}>
            {message.content}
          </p>
        ) : null}

        {sharedJob ? (
          <SharedJobCard job={sharedJob} isTracked={isTracked} onTrack={onTrackJob} />
        ) : null}
      </div>
    </div>
  );
}
