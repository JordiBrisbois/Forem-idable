"use client";

import { ChevronLeft, MessagesSquare, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { EllipsisVertical } from "lucide-react";
import { ConversationAvatar, ParticipantStack } from "@/features/messages/components/MessagesPrimitives";
import { MessageThread } from "@/features/messages/components/MessageThread";
import { cn } from "@/lib/utils";
import { Job } from "@/types/job";
import { ConversationDetail, ConversationMessage, ConversationPreview } from "@/types/messaging";

interface ConversationPanelProps {
  selectedPreview: ConversationPreview | null;
  selectedConversation: ConversationDetail | null;
  error: string | null;
  isConversationLoading: boolean;
  isClosingDirectConversation: boolean;
  trackedJobIds: string[];
  draft: string;
  isSending: boolean;
  isMobile?: boolean;
  onBack?: () => void;
  onCloseDirectConversation: () => void;
  onTrackJob: (job: Job) => void;
  onDeleteMessage: (message: ConversationMessage) => void;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  threadBottomRef: React.RefObject<HTMLDivElement | null>;
  threadScrollAreaRef: React.RefObject<HTMLDivElement | null>;
}

export function ConversationPanel({
  selectedPreview,
  selectedConversation,
  error,
  isConversationLoading,
  isClosingDirectConversation,
  trackedJobIds,
  draft,
  isSending,
  isMobile,
  onBack,
  onCloseDirectConversation,
  onTrackJob,
  onDeleteMessage,
  onDraftChange,
  onSend,
  threadBottomRef,
  threadScrollAreaRef,
}: ConversationPanelProps) {
  if (!selectedPreview) {
    return (
      <Card className="overflow-hidden border-border/60 py-0 md:flex md:h-full md:flex-col">
        <CardContent className="flex flex-1 items-center justify-center px-6 py-10">
          <Empty className="min-h-[420px] rounded-2xl border border-dashed border-border/60 bg-muted/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessagesSquare />
              </EmptyMedia>
              <EmptyTitle>Sélectionne une conversation.</EmptyTitle>
              <EmptyDescription>
                Choisis une conversation pour voir les messages.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/60 py-0 md:flex md:h-full md:flex-col",
        isMobile &&
          "fixed inset-x-0 top-14 z-20 flex h-[calc(100svh-3.5rem)] flex-col rounded-none border-x-0 border-y-0 shadow-none"
      )}
    >
      <CardHeader
        className={cn(
          "gap-2.5 border-b border-border/60 px-4 py-3.5 sm:px-5",
          isMobile && "sticky top-0 z-10 gap-1.5 bg-background/95 px-2.5 py-2 backdrop-blur"
        )}
      >
        <div className={cn("flex flex-wrap items-start justify-between gap-3", isMobile && "gap-2")}>
          <div className={cn("flex min-w-0 flex-1 items-center gap-2.5", isMobile && "gap-2")}>
            {isMobile && onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Retour aux conversations"
                onClick={onBack}
                className="-ml-1 size-8 shrink-0"
              >
                <ChevronLeft />
              </Button>
            ) : null}
            <ConversationAvatar conversation={selectedPreview} size={isMobile ? "sm" : "lg"} />
            <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", isMobile && "gap-0.5")}>
              <div className="min-w-0">
                <CardTitle
                  className={cn(
                    "break-words text-xl",
                    isMobile && "truncate text-sm leading-tight font-semibold"
                  )}
                >
                  {selectedPreview.title}
                </CardTitle>
                {selectedConversation?.subtitle ? (
                  <CardDescription className={cn(isMobile && "truncate text-[11px] leading-tight")}>
                    {selectedConversation.subtitle}
                  </CardDescription>
                ) : null}
              </div>

              {!isMobile && selectedConversation ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {selectedConversation.type === "group" ? "Groupe" : "Privé"}
                  </Badge>
                  <Badge variant="outline">
                    {selectedConversation.participantCount} participant
                    {selectedConversation.participantCount > 1 ? "s" : ""}
                  </Badge>
                  <ParticipantStack
                    participants={selectedConversation.participants}
                    className="ml-1"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {selectedPreview.type === "direct" ? (
            isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0">
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isClosingDirectConversation}
                    onClick={onCloseDirectConversation}
                  >
                    <X className="size-3.5" />
                    Fermer le DM
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                disabled={isClosingDirectConversation}
                onClick={onCloseDirectConversation}
              >
                <X className="size-3.5" />
                Fermer le DM
              </Button>
            )
          ) : null}
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-0 py-0 sm:px-0 sm:py-0",
          isMobile && "px-0 py-0"
        )}
      >
        {selectedConversation ? (
          <MessageThread
            conversation={selectedConversation}
            error={error}
            isLoading={isConversationLoading}
            trackedJobIds={trackedJobIds}
            draft={draft}
            isSending={isSending}
            isMobile={isMobile}
            onTrackJob={onTrackJob}
            onDeleteMessage={onDeleteMessage}
            onDraftChange={onDraftChange}
            onSend={onSend}
            scrollAreaRef={threadScrollAreaRef}
            bottomRef={threadBottomRef}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
