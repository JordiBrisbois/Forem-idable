"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { CoachGroupsSection } from "@/features/coach/components/CoachGroupsSection";
import { CoachPriorityBoard } from "@/features/coach/components/CoachPriorityBoard";
import { CoachRecentActivity } from "@/features/coach/components/CoachRecentActivity";
import { CoachPageState } from "@/features/coach/useCoachPageState";

interface CoachPageContentProps {
  page: CoachPageState;
  currentUserId: number;
  currentUserRole: "coach" | "admin";
}

export function CoachPageContent({
  page,
  currentUserId,
  currentUserRole,
}: CoachPageContentProps) {
  return (
    <div className="flex flex-col gap-6 min-w-0 overflow-x-hidden">
      {page.followedUserCount === 0 ? (
        <Empty className="rounded-2xl border border-dashed bg-card/80 p-8">
          <EmptyHeader>
            <EmptyTitle>Aucun bénéficiaire suivi pour l&apos;instant</EmptyTitle>
            <EmptyDescription>
              Commencez par créer un groupe, puis ajoutez un bénéficiaire pour
              centraliser ses candidatures, ses relances et ses entretiens.
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => page.setIsCreateGroupOpen(true)}>
              Créer un groupe
            </Button>
          </div>
        </Empty>
      ) : (
        <>
          <div id="a-traiter" className="scroll-mt-6">
            <CoachPriorityBoard
              sections={page.prioritySections}
              onOpenUser={page.openUserFromActivity}
            />
          </div>

          <div id="activite-recente" className="scroll-mt-6">
            <CoachRecentActivity
              items={page.recentActivity}
              onOpenItem={page.openUserFromActivity}
            />
          </div>

          <div id="groupes" className="scroll-mt-6">
            <CoachGroupsSection
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              search={page.search}
              onSearchChange={page.setSearch}
              userFilter={page.userFilter}
              onUserFilterChange={page.setUserFilter}
              phaseFilter={page.phaseFilter}
              onPhaseFilterChange={page.setPhaseFilter}
              phaseCounts={page.phaseCounts}
              groupedUsers={page.groupedUsers}
              canRegenerateCalendars={currentUserRole === "admin"}
              onCreateGroup={() => page.setIsCreateGroupOpen(true)}
              onCopyAllGroupsCalendar={() => void page.copyAllGroupsCalendarUrl()}
              onRequestRegenerateAllGroupsCalendar={() =>
                page.setCalendarRegenerationTarget({
                  scope: "all_groups",
                  groupId: null,
                  label: "tous les groupes bénéficiaires",
                })
              }
              onAddMember={page.setMemberPickerGroupId}
              onAddCoach={page.setCoachPickerGroupId}
              onSetManager={page.setManagerPickerGroupId}
              onExportGroup={page.exportGroupApplications}
              onCopyGroupCalendar={(groupId, groupName) =>
                void page.copyGroupCalendarUrl(groupId, groupName)
              }
              onRequestRegenerateGroupCalendar={(groupId, groupName) =>
                page.setCalendarRegenerationTarget({
                  scope: "group",
                  groupId,
                  label: `groupe ${groupName}`,
                })
              }
              onRemoveGroup={(groupId, groupName) =>
                page.setRemoveGroup({ groupId, groupName })
              }
              onOpenUser={page.setSelectedUserId}
              onRemoveMembership={page.setRemoveMembership}
              onRemoveCoach={page.setRemoveCoach}
              onUpdateGroupPhase={page.updateGroupPhase}
              onArchiveGroup={page.archiveGroup}
            />
          </div>
        </>
      )}
    </div>
  );
}
