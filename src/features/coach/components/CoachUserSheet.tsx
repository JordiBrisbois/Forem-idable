"use client";

import { useEffect, useRef } from "react";
import { LocalPagination } from "@/components/ui/local-pagination";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { CoachUserApplicationCard } from "@/features/coach/components/CoachUserApplicationCard";
import { CoachUserSheetDialogs } from "@/features/coach/components/CoachUserSheetDialogs";
import { CoachUserSheetHeader } from "@/features/coach/components/CoachUserSheetHeader";
import { useCoachUserSheetState } from "@/features/coach/components/useCoachUserSheetState";
import { isManualApplication } from "@/features/applications/utils";
import { CoachUserSummary } from "@/types/coach";
import { JobApplicationPatch } from "@/types/application";

interface CoachUserSheetProps {
  currentUserId: number | undefined;
  isAdmin: boolean;
  canEditUser: boolean;
  canManageApiKeys: boolean;
  open: boolean;
  user: CoachUserSummary | null;
  initialJobId?: string | null;
  savingCoachNoteKey: string | null;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onOpenApiKeys: () => void;
  onOpenImport: () => void;
  onEdit: () => void;
  onDeleteUser: () => void;
  onOpenPhaseChange: () => void;
  onSavePrivateCoachNote: (userId: number, jobId: string, content: string) => Promise<boolean>;
  onCreateSharedCoachNote: (userId: number, jobId: string, content: string) => Promise<boolean>;
  onUpdateSharedCoachNote: (
    userId: number,
    jobId: string,
    noteId: string,
    content: string
  ) => Promise<boolean>;
  onDeleteSharedCoachNote: (userId: number, jobId: string, noteId: string) => Promise<boolean>;
  onUpdateApplication: (
    userId: number,
    jobId: string,
    patch: JobApplicationPatch
  ) => Promise<boolean>;
  onDeleteApplication: (userId: number, jobId: string) => Promise<boolean>;
}

export function CoachUserSheet({
  currentUserId,
  isAdmin,
  canEditUser,
  canManageApiKeys,
  open,
  user,
  initialJobId,
  savingCoachNoteKey,
  onOpenChange,
  onExport,
  onOpenApiKeys,
  onOpenImport,
  onEdit,
  onDeleteUser,
  onOpenPhaseChange,
  onSavePrivateCoachNote,
  onCreateSharedCoachNote,
  onUpdateSharedCoachNote,
  onDeleteSharedCoachNote,
  onUpdateApplication,
  onDeleteApplication,
}: CoachUserSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[60vw]">
        {user && (
          <CoachUserSheetBody
            key={`${user.id}:${initialJobId ?? "base"}`}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            canEditUser={canEditUser}
            canManageApiKeys={canManageApiKeys}
            user={user}
            initialJobId={initialJobId}
            savingCoachNoteKey={savingCoachNoteKey}
            onExport={onExport}
            onOpenApiKeys={onOpenApiKeys}
            onOpenImport={onOpenImport}
            onEdit={onEdit}
            onDeleteUser={onDeleteUser}
            onOpenPhaseChange={onOpenPhaseChange}
            onSavePrivateCoachNote={onSavePrivateCoachNote}
            onCreateSharedCoachNote={onCreateSharedCoachNote}
            onUpdateSharedCoachNote={onUpdateSharedCoachNote}
            onDeleteSharedCoachNote={onDeleteSharedCoachNote}
            onUpdateApplication={onUpdateApplication}
            onDeleteApplication={onDeleteApplication}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface CoachUserSheetBodyProps
  extends Omit<CoachUserSheetProps, "open" | "onOpenChange" | "user"> {
  user: CoachUserSummary;
}

function CoachUserSheetBody({
  currentUserId,
  isAdmin,
  canEditUser,
  canManageApiKeys,
  user,
  initialJobId,
  savingCoachNoteKey,
  onExport,
  onOpenApiKeys,
  onOpenImport,
  onEdit,
  onDeleteUser,
  onOpenPhaseChange,
  onSavePrivateCoachNote,
  onCreateSharedCoachNote,
  onUpdateSharedCoachNote,
  onDeleteSharedCoachNote,
  onUpdateApplication,
  onDeleteApplication,
}: CoachUserSheetBodyProps) {
  const targetApplicationRef = useRef<HTMLDivElement | null>(null);
  const {
    applicationsPageSize,
    sortedApplications,
    effectivePage,
    pageCount,
    paginatedApplications,
    expandedJobIds,
    setCurrentPage,
    editingJobId,
    applicationDraft,
    setApplicationDraft,
    isSavingApplication,
    setPrivateNoteDrafts,
    setSharedNoteDrafts,
    newSharedNoteDrafts,
    setNewSharedNoteDrafts,
    deleteApplicationTarget,
    setDeleteApplicationTarget,
    deleteSharedTarget,
    setDeleteSharedTarget,
    toggleExpanded,
    getPrivateDraft,
    getSharedDraft,
    openApplicationEditor,
    resetApplicationEditor,
    saveApplication,
  } = useCoachUserSheetState({
    user,
    initialJobId,
    onUpdateApplication,
  });

  useEffect(() => {
    if (!initialJobId || !targetApplicationRef.current) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      targetApplicationRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [effectivePage, initialJobId, paginatedApplications]);

  return (
    <>
      <CoachUserSheetHeader
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        canEditUser={canEditUser}
        canManageApiKeys={canManageApiKeys}
        user={user}
        onExport={onExport}
        onOpenApiKeys={onOpenApiKeys}
        onOpenImport={onOpenImport}
        onEdit={onEdit}
        onDeleteUser={onDeleteUser}
        onOpenPhaseChange={onOpenPhaseChange}
      />

      <div className="space-y-4 overflow-y-auto p-5">
        {sortedApplications.length > 0 ? (
          <>
          <LocalPagination
            currentPage={effectivePage}
            pageCount={pageCount}
            totalCount={sortedApplications.length}
            pageSize={applicationsPageSize}
            itemLabel="candidatures"
            onPageChange={setCurrentPage}
            compact
          />
          {paginatedApplications.map((application) => {
            const isOpen = expandedJobIds.includes(application.job.id);
            const isEditingApplication =
              editingJobId === application.job.id && applicationDraft !== null;
            const privateCoachNote = application.privateCoachNote;
            const privateCoachNoteDraft = getPrivateDraft(
              application.job.id,
              privateCoachNote?.content
            );
            const newSharedNoteDraft = newSharedNoteDrafts[application.job.id] ?? "";

            return (
              <CoachUserApplicationCard
                key={application.job.id}
                application={application}
                targetRef={application.job.id === initialJobId ? targetApplicationRef : undefined}
                isOpen={isOpen}
                isEditing={isEditingApplication}
                applicationDraft={applicationDraft}
                isSavingApplication={isSavingApplication}
                privateCoachNoteDraft={privateCoachNoteDraft}
                newSharedNoteDraft={newSharedNoteDraft}
                savingCoachNoteKey={savingCoachNoteKey}
                hasNewSharedDraft={Object.prototype.hasOwnProperty.call(newSharedNoteDrafts, application.job.id)}
                getSharedDraft={getSharedDraft}
                onToggleOpen={(nextOpen) => toggleExpanded(application.job.id, nextOpen)}
                onOpenEditor={() => openApplicationEditor(application)}
                onDeleteApplication={() =>
                  setDeleteApplicationTarget({
                    jobId: application.job.id,
                    title: application.job.title,
                  })
                }
                onApplicationDraftChange={(updater) =>
                  setApplicationDraft((current) => (current ? updater(current) : current))
                }
                onCancelEdit={resetApplicationEditor}
                onSaveApplication={() =>
                  void saveApplication(application, applicationDraft!, isManualApplication(application))
                }
                onPrivateDraftChange={(value) =>
                  setPrivateNoteDrafts((current) => ({
                    ...current,
                    [application.job.id]: value,
                  }))
                }
                onSavePrivateNote={() =>
                  void onSavePrivateCoachNote(user.id, application.job.id, privateCoachNoteDraft)
                }
                onSharedDraftChange={(noteId, value) =>
                  setSharedNoteDrafts((current) => ({
                    ...current,
                    [noteId]: value,
                  }))
                }
                onStartCreateSharedNote={() =>
                  setNewSharedNoteDrafts((current) => ({
                    ...current,
                    [application.job.id]: current[application.job.id] ?? "",
                  }))
                }
                onCancelCreateSharedNote={() =>
                  setNewSharedNoteDrafts((current) => {
                    const next = { ...current };
                    delete next[application.job.id];
                    return next;
                  })
                }
                onNewSharedDraftChange={(value) =>
                  setNewSharedNoteDrafts((current) => ({
                    ...current,
                    [application.job.id]: value,
                  }))
                }
                onCreateSharedNote={async () => {
                  const created = await onCreateSharedCoachNote(
                    user.id,
                    application.job.id,
                    newSharedNoteDraft
                  );
                  if (!created) return;

                  setNewSharedNoteDrafts((current) => {
                    const next = { ...current };
                    delete next[application.job.id];
                    return next;
                  });
                }}
                onDeleteSharedNote={(noteId) =>
                  setDeleteSharedTarget({
                    jobId: application.job.id,
                    noteId,
                  })
                }
                onSaveSharedNote={(noteId, content) =>
                  void onUpdateSharedCoachNote(user.id, application.job.id, noteId, content)
                }
              />
            );
          })}
          <LocalPagination
            currentPage={effectivePage}
            pageCount={pageCount}
            totalCount={sortedApplications.length}
            pageSize={applicationsPageSize}
            itemLabel="candidatures"
            onPageChange={setCurrentPage}
          />
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Aucune candidature enregistrée pour cet utilisateur.
          </div>
        )}
      </div>

      <CoachUserSheetDialogs
        user={user}
        editingJobId={editingJobId}
        deleteApplicationTarget={deleteApplicationTarget}
        deleteSharedTarget={deleteSharedTarget}
        savingCoachNoteKey={savingCoachNoteKey}
        onDeleteApplicationTargetChange={setDeleteApplicationTarget}
        onDeleteSharedTargetChange={setDeleteSharedTarget}
        onResetApplicationEditor={resetApplicationEditor}
        onDeleteApplication={onDeleteApplication}
        onDeleteSharedCoachNote={onDeleteSharedCoachNote}
      />
    </>
  );
}
