"use client";

import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  ChevronDown,
  Download,
  MoreHorizontal,
  Trash2,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CoachGroupMemberCard } from "@/features/coach/components/CoachGroupMemberCard";
import {
  CoachGroupedUserGroup,
  CoachRemoveCoachTarget,
  CoachRemoveMembershipTarget,
} from "@/features/coach/types";
import { formatCoachDate, getCoachUserDisplayName } from "@/features/coach/utils";
import { getSummaryBadgeVariant } from "@/features/coach/utils/phaseBadge";
import { CoachUserSummary } from "@/types/coach";

interface CoachGroupCardProps {
  group: CoachGroupedUserGroup;
  isOpen: boolean;
  onToggleOpen: () => void;
  currentUserId: number;
  currentUserRole: "coach" | "admin";
  canRegenerateCalendars: boolean;
  onExportGroup: (name: string, members: CoachUserSummary[]) => void;
  onCopyGroupCalendar: (id: number, name: string) => void;
  onRequestRegenerateGroupCalendar: (id: number, name: string) => void;
  onAddMember: (id: number) => void;
  onAddCoach: (id: number) => void;
  onSetManager: (id: number) => void;
  onRemoveGroup: (id: number, name: string) => void;
  onOpenUser: (userId: number) => void;
  onRemoveMembership: (target: CoachRemoveMembershipTarget) => void;
  onRemoveCoach: (target: CoachRemoveCoachTarget) => void;
  onArchiveGroup: (id: number, archived: boolean) => void;
  onOpenPhaseDialog: (group: CoachGroupedUserGroup) => void;
}

function canManageAssignedCoaches(
  currentUserRole: "coach" | "admin",
  currentUserId: number,
  managerCoachId: number | null
) {
  return currentUserRole === "admin" || managerCoachId === currentUserId;
}

function canRemoveAssignedCoach(
  currentUserRole: "coach" | "admin",
  currentUserId: number,
  managerCoachId: number | null,
  coachId: number
) {
  return (
    canManageAssignedCoaches(currentUserRole, currentUserId, managerCoachId) &&
    !(currentUserRole === "coach" && coachId === currentUserId)
  );
}

export function CoachGroupCard({
  group,
  isOpen,
  onToggleOpen,
  currentUserId,
  currentUserRole,
  canRegenerateCalendars,
  onExportGroup,
  onCopyGroupCalendar,
  onRequestRegenerateGroupCalendar,
  onAddMember,
  onAddCoach,
  onSetManager,
  onRemoveGroup,
  onOpenUser,
  onRemoveMembership,
  onRemoveCoach,
  onArchiveGroup,
  onOpenPhaseDialog,
}: CoachGroupCardProps) {
  const isArchived = Boolean(group.archivedAt);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggleOpen}
      className={`rounded-xl border border-border/60 p-3.5 sm:p-4 ${isArchived ? "bg-muted/40 opacity-80" : "bg-muted/20"}`}
    >
      <CollapsibleTrigger asChild>
        <div className="flex cursor-pointer flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
               <p className="min-w-0 break-words text-base font-semibold">{group.name}</p>
              {isArchived ? (
                <Badge variant="secondary">Archivé</Badge>
              ) : (
                <Badge
                  variant={group.kind === "ungrouped" ? "secondary" : "outline"}
                >
                  {group.kind === "ungrouped" ? "Groupe système" : "Groupe actif"}
                </Badge>
              )}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:gap-2">
              <Badge variant="outline">
                <Users data-icon="inline-start" />
                {group.members.length} membre
                {group.members.length > 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline">
                {group.totalApplications} candidatures
              </Badge>
              <Badge variant="info" className="hidden sm:inline-flex">
                {group.totalInterviews} entretien(s)
              </Badge>
              {group.totalDue > 0 && (
                <Badge variant="warning">{group.totalDue} relance(s)</Badge>
              )}
              {group.totalAccepted > 0 && (
                <Badge variant={getSummaryBadgeVariant("accepted")}>
                  {group.totalAccepted} acceptée(s)
                </Badge>
              )}
              {group.totalRejected > 0 && (
                <Badge variant={getSummaryBadgeVariant("rejected")}>
                  {group.totalRejected} refusée(s)
                </Badge>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {group.kind === "standard"
                ? `${group.coaches.length} coach${group.coaches.length > 1 ? "s" : ""}`
                : "Aucun coach attribué"}
              {group.createdByLabel ? <span className="break-all"> • créé par {group.createdByLabel}</span> : null}
            </p>
            {group.kind === "standard" ? (
              <TooltipProvider>
                <div className="mt-2 flex min-w-0 flex-wrap gap-1.5 sm:gap-2">
                  {group.coaches.length > 0 ? (
                    group.coaches.map((coach) => (
                      <Tooltip key={`${group.id}-coach-${coach.id}`}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1.5 py-1 text-[11px] sm:gap-2 sm:text-xs"
                          >
                            <span className="max-w-52 truncate">
                              {getCoachUserDisplayName(coach)}
                            </span>
                            {group.managerCoachId === coach.id ? (
                              <Badge
                                variant="outline"
                                className="px-1.5 text-[10px] uppercase tracking-wide"
                              >
                                Manager
                              </Badge>
                            ) : null}
                            {canRemoveAssignedCoach(
                              currentUserRole,
                              currentUserId,
                              group.managerCoachId,
                              coach.id
                            ) ? (
                              <button
                                type="button"
                                className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onRemoveCoach({
                                    groupId: group.id,
                                    userId: coach.id,
                                    userEmail: coach.email,
                                    groupName: group.name,
                                  });
                                }}
                                aria-label={`Retirer ${coach.email} du groupe ${group.name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            ) : null}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6}>
                          Dernière connexion:{" "}
                          {formatCoachDate(coach.lastSeenAt, true)}
                        </TooltipContent>
                      </Tooltip>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Aucun coach attribué.
                    </span>
                  )}
                </div>
              </TooltipProvider>
            ) : null}
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <Button
              type="button"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={(e) => {
                e.stopPropagation();
                onExportGroup(group.name, group.members);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            {(group.kind === "standard" || group.canAddMembers) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {group.kind === "standard" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onCopyGroupCalendar(group.id, group.name)}
                      >
                        <CalendarDays className="h-4 w-4" />
                        Copier le lien d&apos;agenda
                      </DropdownMenuItem>
                      {canRegenerateCalendars ? (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            onRequestRegenerateGroupCalendar(group.id, group.name)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          Régénérer le lien
                        </DropdownMenuItem>
                      ) : null}
                    </>
                  )}
                  {group.canAddMembers && (
                    <>
                      {group.kind === "standard" ? (
                        <DropdownMenuSeparator />
                      ) : null}
                      <DropdownMenuItem onClick={() => onAddMember(group.id)}>
                        <UserRoundPlus className="h-4 w-4" />
                        Ajouter un membre
                      </DropdownMenuItem>
                    </>
                  )}
                  {group.kind === "standard" &&
                  group.canManageCoaches &&
                  canManageAssignedCoaches(
                    currentUserRole,
                    currentUserId,
                    group.managerCoachId
                  ) ? (
                    <>
                      <DropdownMenuItem onClick={() => onAddCoach(group.id)}>
                        <UserRoundPlus className="h-4 w-4" />
                        Attribuer un coach
                      </DropdownMenuItem>
                      {currentUserRole === "admin" ? (
                        <DropdownMenuItem onClick={() => onSetManager(group.id)}>
                          <UserRoundPlus className="h-4 w-4" />
                          Définir le manager
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem onClick={() => onOpenPhaseDialog(group)}>
                        <Users className="h-4 w-4" />
                        Changer de phase
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onArchiveGroup(group.id, !isArchived)}
                      >
                        {isArchived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                        {isArchived ? "Désarchiver" : "Archiver"}
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  {group.kind === "standard" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onRemoveGroup(group.id, group.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer le groupe
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3 lg:grid-cols-2">
          {group.members.length > 0 ? (
            group.members.map((entry) => (
              <CoachGroupMemberCard
                key={`${group.id}-${entry.id}`}
                entry={entry}
                groupId={group.id}
                groupName={group.name}
                groupKind={group.kind}
                onOpenUser={onOpenUser}
                onRemoveMembership={onRemoveMembership}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Aucun utilisateur correspondant.
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
