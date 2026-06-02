"use client";

import { UserRound, Users } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ConversationParticipantSummary, ConversationPreview } from "@/types/messaging";
import { getDisplayName, getInitials, stringToHslBackground, stringToHslForeground } from "@/features/messages/messages.utils";

export function ConversationAvatar({
  conversation,
  size = "default",
}: {
  conversation: Pick<ConversationPreview, "title" | "type">;
  size?: "sm" | "default" | "lg";
}) {
  const bg = stringToHslBackground(conversation.title);
  const fg = stringToHslForeground(conversation.title);

  return (
    <Avatar size={size} className="border border-border/70 shrink-0" style={{ backgroundColor: bg }}>
      <AvatarFallback style={{ color: fg }}>
        {conversation.type === "group" ? <Users className="size-[55%]" /> : <UserRound className="size-[55%]" />}
      </AvatarFallback>
    </Avatar>
  );
}

export function ParticipantStack({
  participants,
  className,
}: {
  participants: ConversationParticipantSummary[];
  className?: string;
}) {
  const visibleParticipants = participants.slice(0, 3);
  const hiddenParticipants = participants.slice(visibleParticipants.length);
  const hiddenCount = hiddenParticipants.length;

  if (participants.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={120}>
      <AvatarGroup className={cn("-space-x-1.5", className)}>
        {visibleParticipants.map((participant) => {
          const displayName = getDisplayName({
            firstName: participant.firstName,
            lastName: participant.lastName,
            email: participant.email,
            fallback: "Participant",
          });
          const bg = stringToHslBackground(displayName);
          const fg = stringToHslForeground(displayName);

          return (
            <Tooltip key={participant.userId}>
              <TooltipTrigger asChild>
                <Avatar size="sm" className="border border-border/70" style={{ backgroundColor: bg }}>
                  <AvatarFallback style={{ color: fg }}>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                {displayName}
              </TooltipContent>
            </Tooltip>
          );
        })}
        {hiddenCount > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <AvatarGroupCount>+{hiddenCount}</AvatarGroupCount>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="max-w-56">
              <p className="font-medium">Participants supplémentaires</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {hiddenParticipants
                  .map((participant) =>
                    getDisplayName({
                      firstName: participant.firstName,
                      lastName: participant.lastName,
                      email: participant.email,
                      fallback: "Participant",
                    })
                  )
                  .join(", ")}
              </p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </AvatarGroup>
    </TooltipProvider>
  );
}
