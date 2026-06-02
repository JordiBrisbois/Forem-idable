"use client";

import React from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CoachPhaseBadge } from "@/features/coach/components/CoachPhaseBadge";
import { CoachStatGrid } from "@/features/coach/components/CoachStatGrid";
import { CoachUserActivityMeta } from "@/features/coach/components/CoachUserActivityMeta";
import { CoachGroupedGroupKind, CoachRemoveMembershipTarget } from "@/features/coach/types";
import { getCoachUserDisplayName } from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

interface CoachGroupMemberCardProps {
  entry: CoachUserSummary;
  groupId: number;
  groupName: string;
  groupKind: CoachGroupedGroupKind;
  onOpenUser: (userId: number) => void;
  onRemoveMembership: (target: CoachRemoveMembershipTarget) => void;
}

export const CoachGroupMemberCard = React.memo(function CoachGroupMemberCard({
  entry,
  groupId,
  groupName,
  groupKind,
  onOpenUser,
  onRemoveMembership,
}: CoachGroupMemberCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="min-w-0 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/30 sm:px-4"
      onClick={() => onOpenUser(entry.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenUser(entry.id);
        }
      }}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 break-words font-medium">
                  {getCoachUserDisplayName(entry)}
                </p>
                <Badge variant="secondary" className="capitalize">
                  {entry.role}
                </Badge>
                <CoachPhaseBadge
                  phase={entry.trackingPhase}
                  hasAcceptedStage={entry.hasAcceptedStage}
                  hasAcceptedJob={entry.hasAcceptedJob}
                />
              </div>
            </div>
            {groupKind === "standard" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-[-2px] shrink-0"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(event) => event.stopPropagation()}
                >
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveMembership({
                        groupId,
                        userId: entry.id,
                        userEmail: entry.email,
                        groupName,
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Retirer du groupe
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground" title={entry.email}>
            {entry.email}
          </p>
          <p className="break-all text-xs text-muted-foreground">
            {entry.groupNames.length > 0
              ? entry.groupNames.join(" • ")
              : "Sans groupe"}
          </p>
          <CoachUserActivityMeta
            user={entry}
            compact
            className="flex items-center gap-3 text-xs text-muted-foreground"
            firstItemClassName="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"
          />
        </div>
        <div className="grid min-w-0 gap-2 sm:min-w-[250px]">
          <CoachStatGrid
            applicationCount={entry.applicationCount}
            interviewCount={entry.interviewCount}
            dueCount={entry.dueCount}
            acceptedCount={entry.acceptedCount}
            rejectedCount={entry.rejectedCount}
          />
        </div>
      </div>
    </div>
  );
});
