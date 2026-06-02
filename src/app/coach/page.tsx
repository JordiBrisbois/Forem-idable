"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachDialogs } from "@/features/coach/components/CoachDialogs";
import { CoachImportApplicationsDialog } from "@/features/coach/components/CoachImportApplicationsDialog";
import { CoachPageContent } from "@/features/coach/components/CoachPageContent";
import { CoachPageHeader } from "@/features/coach/components/CoachPageHeader";
import { CoachSummaryCards } from "@/features/coach/components/CoachSummaryCards";
import { CoachUserPhaseDialog } from "@/features/coach/components/CoachUserPhaseDialog";
import { CoachUserSheet } from "@/features/coach/components/CoachUserSheet";
import { useCoachPageState } from "@/features/coach/useCoachPageState";
import { useToastFeedback } from "@/hooks/useToastFeedback";

function CoachPageSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-4 w-full max-w-3xl" />
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[420px]">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-full max-w-xl" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border p-4">
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-full" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border p-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CoachPage() {
  const page = useCoachPageState();

  useToastFeedback(page.feedback, { title: "Espace coach" });
  useToastFeedback(page.apiKeysFeedback, { title: "Clés API coach" });

  if (page.isAuthLoading || page.isLoading) {
    return <CoachPageSkeleton />;
  }

  if (
    !page.user ||
    (page.user.role !== "coach" && page.user.role !== "admin")
  ) {
    return (
      <Card className="mx-auto max-w-3xl gap-0 py-0">
        <CardContent className="p-8">
          <h1 className="text-2xl font-black tracking-tight">Accès réservé</h1>
          <p className="mt-2 text-muted-foreground">
            Cette page est réservée aux comptes `coach` et `admin`.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <CoachPageHeader
        role={page.user.role}
        undoLabel={page.undoAction?.label ?? null}
        onUndo={() => void page.undoLastAction()}
      />

      <CoachSummaryCards
        userCount={page.followedUserCount}
        totalApplications={page.totalApplications}
        totalInterviews={page.totalInterviews}
        totalDue={page.totalDue}
        totalAccepted={page.totalAccepted}
        totalRejected={page.totalRejected}
        phaseCounts={page.phaseCounts}
      />

      <CoachPageContent
        page={page}
        currentUserId={page.user.id}
        currentUserRole={page.user.role}
      />

      <CoachUserSheet
        key={`${page.selectedUser?.id ?? "none"}:${page.activityTargetJobId ?? "base"}`}
        currentUserId={page.user.id}
        isAdmin={page.user.role === "admin"}
        canEditUser={page.canEditSelectedUser}
        canManageApiKeys={Boolean(page.canManageSelectedUserApiKeys)}
        open={Boolean(page.selectedUser)}
        user={page.selectedUser}
        initialJobId={page.activityTargetJobId}
        savingCoachNoteKey={page.savingCoachNoteKey}
        onOpenChange={page.closeSelectedUserSheet}
        onExport={page.exportUserApplications}
        onOpenApiKeys={() => void page.openManagedUserApiKeys()}
        onOpenImport={() => page.setImportTargetUserId(page.selectedUser?.id ?? null)}
        onEdit={page.openSelectedUserEditor}
        onDeleteUser={page.openSelectedUserDeletion}
        onOpenPhaseChange={page.openSelectedUserPhaseChange}
        onSavePrivateCoachNote={(userId, jobId, content) =>
          page.savePrivateCoachNote(userId, jobId, content)
        }
        onCreateSharedCoachNote={(userId, jobId, content) =>
          page.createSharedCoachNote(userId, jobId, content)
        }
        onUpdateSharedCoachNote={(userId, jobId, noteId, content) =>
          page.updateSharedCoachNote(userId, jobId, noteId, content)
        }
        onDeleteSharedCoachNote={(userId, jobId, noteId) =>
          page.deleteSharedCoachNote(userId, jobId, noteId)
        }
        onUpdateApplication={(userId, jobId, patch) =>
          page.updateManagedApplication(userId, jobId, patch)
        }
        onDeleteApplication={(userId, jobId) =>
          page.deleteManagedApplication(userId, jobId)
        }
      />

      <CoachUserPhaseDialog
        open={Boolean(page.phaseDialogUser)}
        userName={page.phaseDialogUser ? `${page.phaseDialogUser.firstName} ${page.phaseDialogUser.lastName}`.trim() || page.phaseDialogUser.email : ""}
        currentPhase={page.phaseDialogUser?.trackingPhase ?? "job_search"}
        onOpenChange={page.closePhaseDialog}
        onConfirm={(phase, reason) => {
          if (page.phaseDialogUser) {
            page.updateUserPhase(page.phaseDialogUser.id, phase, reason);
          }
          page.setPhaseDialogUser(null);
        }}
      />

      <CoachDialogs page={page} />

      <CoachImportApplicationsDialog
        open={Boolean(page.importTargetUser)}
        userLabel={page.importTargetUser ? page.importTargetUser.email : "ce bénéficiaire"}
        isImporting={page.isImportingApplications}
        onOpenChange={page.closeImportDialog}
        onImport={(rows, dateFormat) => {
          if (!page.importTargetUser) return Promise.resolve(null);
          return page.importApplicationsForUser(
            page.importTargetUser.id,
            dateFormat,
            rows
          );
        }}
      />
    </div>
  );
}
