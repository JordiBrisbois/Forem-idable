"use client";

import { useCallback, useState } from "react";
import { CalendarDays, CircleHelp, FolderPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CoachGroupCard } from "@/features/coach/components/CoachGroupCard";
import { CoachGroupPhaseDialog } from "@/features/coach/components/CoachGroupPhaseDialog";
import { CoachGroupToolbar } from "@/features/coach/components/CoachGroupToolbar";
import { coachUserFilterOptions } from "@/features/coach/filters";
import {
  CoachGroupedUserGroup,
  CoachPhaseFilter,
  CoachRemoveCoachTarget,
  CoachRemoveMembershipTarget,
  CoachUserFilter,
} from "@/features/coach/types";
import { runtimeConfig } from "@/config/runtime";
import { CoachUserSummary, TrackingPhase } from "@/types/coach";

const COLLAPSE_STORAGE_KEY = "forem:coach:group-collapse:v1";

function getStoredCollapseState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveCollapseState(state: Record<string, boolean>) {
  try {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

interface CoachGroupsSectionProps {
  currentUserId: number;
  currentUserRole: "coach" | "admin";
  search: string;
  onSearchChange: (value: string) => void;
  userFilter: CoachUserFilter;
  onUserFilterChange: (value: CoachUserFilter) => void;
  phaseFilter: CoachPhaseFilter;
  onPhaseFilterChange: (value: CoachPhaseFilter) => void;
  phaseCounts: Record<CoachPhaseFilter, number>;
  groupedUsers: CoachGroupedUserGroup[];
  canRegenerateCalendars: boolean;
  onCreateGroup: () => void;
  onCopyAllGroupsCalendar: () => void;
  onRequestRegenerateAllGroupsCalendar: () => void;
  onAddMember: (groupId: number) => void;
  onAddCoach: (groupId: number) => void;
  onSetManager: (groupId: number) => void;
  onExportGroup: (groupName: string, members: CoachUserSummary[]) => void;
  onCopyGroupCalendar: (groupId: number, groupName: string) => void;
  onRequestRegenerateGroupCalendar: (groupId: number, groupName: string) => void;
  onRemoveGroup: (groupId: number, groupName: string) => void;
  onOpenUser: (userId: number) => void;
  onRemoveMembership: (target: CoachRemoveMembershipTarget) => void;
  onRemoveCoach: (target: CoachRemoveCoachTarget) => void;
  onUpdateGroupPhase: (groupId: number, phase: TrackingPhase, reason?: string) => void;
  onArchiveGroup: (groupId: number, archived: boolean) => void;
}

export function CoachGroupsSection({
  currentUserId,
  currentUserRole,
  search,
  onSearchChange,
  userFilter,
  onUserFilterChange,
  phaseFilter,
  onPhaseFilterChange,
  phaseCounts,
  groupedUsers,
  canRegenerateCalendars,
  onCreateGroup,
  onCopyAllGroupsCalendar,
  onRequestRegenerateAllGroupsCalendar,
  onAddMember,
  onAddCoach,
  onSetManager,
  onExportGroup,
  onCopyGroupCalendar,
  onRequestRegenerateGroupCalendar,
  onRemoveGroup,
  onOpenUser,
  onRemoveMembership,
  onRemoveCoach,
  onUpdateGroupPhase,
  onArchiveGroup,
}: CoachGroupsSectionProps) {
  const [isCalendarHelpOpen, setIsCalendarHelpOpen] = useState(false);
  const [phaseDialogGroup, setPhaseDialogGroup] = useState<CoachGroupedUserGroup | null>(null);
  const [collapseState, setCollapseState] = useState<Record<string, boolean>>(getStoredCollapseState);

  const toggleCollapse = useCallback((groupKey: string) => {
    setCollapseState((prev) => {
      const next = { ...prev, [groupKey]: !prev[groupKey] };
      saveCollapseState(next);
      return next;
    });
  }, []);

  const archivedGroups = groupedUsers.filter((g) => g.archivedAt);
  const activeGroups = groupedUsers.filter((g) => !g.archivedAt);

  function renderGroupCard(group: CoachGroupedUserGroup) {
    const groupKey = `${group.kind}-${group.id}`;
    return (
      <CoachGroupCard
        key={groupKey}
        group={group}
        isOpen={collapseState[groupKey] !== false}
        onToggleOpen={() => toggleCollapse(groupKey)}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        canRegenerateCalendars={canRegenerateCalendars}
        onExportGroup={onExportGroup}
        onCopyGroupCalendar={onCopyGroupCalendar}
        onRequestRegenerateGroupCalendar={onRequestRegenerateGroupCalendar}
        onAddMember={onAddMember}
        onAddCoach={onAddCoach}
        onSetManager={onSetManager}
        onRemoveGroup={onRemoveGroup}
        onOpenUser={onOpenUser}
        onRemoveMembership={onRemoveMembership}
        onRemoveCoach={onRemoveCoach}
        onArchiveGroup={onArchiveGroup}
        onOpenPhaseDialog={setPhaseDialogGroup}
      />
    );
  }

  return (
    <Card className="gap-4 py-0">
      <CardHeader className="border-b px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">Groupes</CardTitle>
            <CardDescription>
              Recherche, suivi et gestion détaillée des personnes directement par groupe.
            </CardDescription>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button type="button" className="flex-1 sm:flex-none" onClick={onCreateGroup}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Créer un groupe
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="flex-1 sm:flex-none">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Calendriers
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={onCopyAllGroupsCalendar}>
                  <CalendarDays className="h-4 w-4" />
                  Copier le lien d&apos;agenda global
                </DropdownMenuItem>
                {canRegenerateCalendars ? (
                  <DropdownMenuItem variant="destructive" onClick={onRequestRegenerateAllGroupsCalendar}>
                    <Trash2 className="h-4 w-4" />
                    Régénérer le lien global
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={() => setIsCalendarHelpOpen(true)} aria-label="Aide agenda" title="Aide agenda">
              <CircleHelp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-5 pb-5 sm:space-y-4">
        <CoachGroupToolbar
          search={search}
          onSearchChange={onSearchChange}
          phaseFilter={phaseFilter}
          onPhaseFilterChange={onPhaseFilterChange}
          phaseCounts={phaseCounts}
          userFilter={userFilter}
          onUserFilterChange={onUserFilterChange}
          filterOptions={coachUserFilterOptions}
        />

        <div className="min-h-[300px] space-y-4">
          {activeGroups.length > 0 ? activeGroups.map(renderGroupCard) : null}
          {archivedGroups.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Groupes archivés</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {archivedGroups.map(renderGroupCard)}
            </div>
          )}
          {activeGroups.length === 0 && archivedGroups.length === 0 && (
            <div className="rounded-xl border border-dashed bg-muted/10 p-6">
              <p className="font-medium">Aucun résultat dans cette vue</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {search.trim()
                  ? "Essayez un autre nom, prénom ou email, ou retirez un filtre rapide."
                  : userFilter === "all" && phaseFilter === "all"
                    ? "Ajoutez un groupe ou un bénéficiaire pour commencer le suivi coach."
                    : "Aucun bénéficiaire ne correspond à ce filtre pour l'instant."}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CoachGroupPhaseDialog
        open={Boolean(phaseDialogGroup)}
        groupName={phaseDialogGroup?.name ?? ""}
        onOpenChange={(open) => {
          if (!open) setPhaseDialogGroup(null);
        }}
        onConfirm={(phase, reason) => {
          if (phaseDialogGroup) {
            onUpdateGroupPhase(phaseDialogGroup.id, phase, reason);
          }
          setPhaseDialogGroup(null);
        }}
      />

      <Dialog open={isCalendarHelpOpen} onOpenChange={setIsCalendarHelpOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Synchronisation calendrier</DialogTitle>
            <DialogDescription>
              Les liens calendrier permettent d&apos;abonner Google Calendar, Outlook ou Apple Calendar
              a un flux d&apos;entretiens mis a jour automatiquement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>`Copier le lien d&apos;agenda` copie une URL a coller dans Google Calendar via `Ajouter un agenda` puis `A partir de l&apos;URL`.</p>
            <p>Le calendrier se met ensuite a jour quand un entretien est ajoute, modifie ou supprime dans {runtimeConfig.app.name}.</p>
            <p>La synchronisation n&apos;est pas immediate: Google choisit lui-meme la frequence de rafraichissement.</p>
            <p>Si vous remplacez le lien utilise dans votre agenda, il faut re-ajouter la nouvelle URL dans Google Calendar.</p>
            <p>Le lien global rassemble tous les groupes beneficiaires visibles par votre compte.</p>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsCalendarHelpOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
