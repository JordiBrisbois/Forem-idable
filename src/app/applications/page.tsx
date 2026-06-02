"use client";

import { AccountAccessPrompt } from "@/components/auth/AccountAccessPrompt";
import { LocalPagination } from "@/components/ui/local-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationCard } from "@/features/applications/components/ApplicationCard";
import { ApplicationDetailsSheet } from "@/features/applications/components/ApplicationDetailsSheet";
import { ApplicationsEmptyState } from "@/features/applications/components/ApplicationsEmptyState";
import { ApplicationsHeaderControls } from "@/features/applications/components/ApplicationsHeaderControls";
import { ApplicationsInsights } from "@/features/applications/components/ApplicationsInsights";
import { ApplicationsPageIntro } from "@/features/applications/components/ApplicationsPageIntro";
import { BulkActionBar } from "@/features/applications/components/BulkActionBar";
import { BulkActionsDialog } from "@/features/applications/components/BulkActionsDialog";
import { DeleteApplicationDialog } from "@/features/applications/components/DeleteApplicationDialog";
import { InterviewDialog } from "@/features/applications/components/InterviewDialog";
import { ManualApplicationDialog } from "@/features/applications/components/ManualApplicationDialog";
import { applicationStatusLabel } from "@/features/applications/utils";
import { useApplicationsPageState } from "@/features/applications/hooks/useApplicationsPageState";

function ApplicationsPageSkeleton() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-10 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-32" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="h-14 w-full" />
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-36" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function ApplicationsPage() {
  const page = useApplicationsPageState();
  const selectedApplication = page.selectedApplication;

  if (page.isAuthLoading || !page.isLoaded) return <ApplicationsPageSkeleton />;

  if (!page.user) {
    return (
      <AccountAccessPrompt
        title="Candidatures"
        description="Connectez-vous pour suivre vos candidatures, relances, entretiens et notes dans un espace dédié."
        summary="Avec un compte, vous retrouvez automatiquement vos candidatures et votre historique de recherche, et vous pouvez partager votre suivi avec un coach si besoin."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <ApplicationsPageIntro />

      <ApplicationsHeaderControls
        displayedCount={page.filteredApplications.length}
        totalCount={page.applications.length}
        dueCount={page.dueCount}
        dueSummary={page.dueSummary}
        canExportCalendar={page.filteredApplications.some((entry) => entry.interviewAt)}
        onCreateManual={page.openCreate}
        onExportCsv={page.exportApplications}
        onExportCalendar={page.exportCalendar}
      />

      <ApplicationsInsights
        totalCount={page.applications.length}
        dueCount={page.dueCount}
        upcomingInterviewCount={page.upcomingInterviewCount}
        closedCount={page.closedCount}
        coachUpdateCount={page.unreadCoachUpdateCount}
        hasCoachContext={page.hasCoachContext}
        search={page.search}
        modeFilter={page.modeFilter}
        onSearchChange={page.handleSearchChange}
        onModeFilterChange={page.handleModeFilterChange}
      />

      {page.filteredApplications.length > 0 ? (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            {page.paginatedApplications.map((application) => (
              <ApplicationCard
                key={application.job.id}
                application={application}
                now={page.now}
                isSelected={page.selectedJobIds.has(application.job.id)}
                hasUnreadCoachUpdate={page.hasUnreadCoachUpdate(application)}
                onToggleSelection={page.toggleSelection}
                onOpenDetails={page.openDetails}
                onApplyStatus={page.applyStatus}
                onMarkFollowUpDone={page.markFollowUpDone}
                onOpenInterview={page.openInterviewModal}
              />
            ))}
          </div>

          <LocalPagination
            currentPage={page.effectiveApplicationsPage}
            pageCount={page.applicationsPageCount}
            totalCount={page.filteredApplications.length}
            pageSize={page.pageSize}
            itemLabel="candidatures"
            onPageChange={page.setCurrentPage}
          />
        </>
      ) : (
        <ApplicationsEmptyState
          hasApplications={page.applications.length > 0}
          onCreateManual={page.openCreate}
          onResetFilters={page.resetFilters}
        />
      )}

      <BulkActionBar
        selectedCount={page.selectedJobIds.size}
        selectedFollowUpCount={page.selectedFollowUpCount}
        selectedFollowUpDisabledCount={page.selectedFollowUpDisabledCount}
        isBusy={page.isBulkMutating}
        isAllSelected={page.isAllSelected}
        onToggleSelectAll={page.toggleSelectAll}
        onClearSelection={page.clearSelection}
        onDeleteSelected={page.removeSelected}
        onDisableFollowUp={page.openDisableFollowUpDialog}
        onEnableFollowUp={page.openEnableFollowUpDialog}
        onChangeStatus={page.openChangeStatusDialog}
      />

      <ApplicationDetailsSheet
        application={selectedApplication}
        open={Boolean(selectedApplication)}
        hasUnreadCoachUpdate={
          selectedApplication ? page.hasUnreadCoachUpdate(selectedApplication) : false
        }
        notesDraft={page.currentNotesDraft}
        proofsDraft={page.currentProofsDraft}
        onOpenChange={(open) => {
          if (!open) page.closeDetails();
        }}
        onApplyStatus={page.applyStatus}
        onNotesDraftChange={(value) =>
          selectedApplication
            ? page.setNotesDraft(selectedApplication.job.id, value)
            : undefined
        }
        onProofsDraftChange={(value) =>
          selectedApplication
            ? page.setProofsDraft(selectedApplication.job.id, value)
            : undefined
        }
        onSaveNotes={page.saveSelectedNotes}
        onSaveProofs={page.saveSelectedProofs}
        onSaveManualDetails={(input) =>
          selectedApplication
            ? page.updateManualApplicationDetails(
                selectedApplication.job.id,
                selectedApplication.job,
                input
              )
            : Promise.resolve(false)
        }
        onSaveFollowUpSettings={(input) =>
          selectedApplication
            ? page.updateFollowUpSettings(selectedApplication.job.id, {
                ...input,
                status: selectedApplication.status,
              })
            : Promise.resolve(false)
        }
        onMarkFollowUpDone={page.markFollowUpDone}
        onOpenInterview={page.openInterviewModal}
        onRequestDelete={page.openDelete}
      />

      <ManualApplicationDialog
        open={page.isCreateOpen}
        form={page.manualForm}
        onOpenChange={(open) => (open ? page.openCreate() : page.closeCreate())}
        onFormChange={page.setManualForm}
        onCancel={() => {
          page.resetManualForm();
          page.closeCreate();
        }}
        onSubmit={page.submitManualForm}
      />

      <InterviewDialog
        application={page.interviewApplication}
        open={Boolean(page.interviewApplication)}
        form={page.interviewForm}
        onOpenChange={(open) => {
          if (!open) page.resetInterviewDialog();
        }}
        onFormChange={page.setInterviewForm}
        onRemove={page.removeInterview}
        onCancel={page.resetInterviewDialog}
        onSubmit={page.submitInterview}
      />

      <DeleteApplicationDialog
        application={page.deleteApplication}
        open={Boolean(page.deleteApplication)}
        onOpenChange={(open) => {
          if (!open) page.closeDelete();
        }}
        onCancel={page.closeDelete}
        onConfirm={page.confirmDelete}
      />

      <BulkActionsDialog
        open={page.bulkDialogAction === "delete-selected"}
        onOpenChange={(open) => {
          if (!open && !page.isBulkMutating) page.setBulkDialogAction(null);
        }}
        title="Supprimer la sélection ?"
        description={`Cette action retirera ${page.selectedJobIds.size} candidature${page.selectedJobIds.size > 1 ? "s" : ""} de votre suivi.`}
        confirmLabel="Supprimer"
        pendingLabel="Suppression..."
        isPending={page.isBulkMutating}
        variant="destructive"
        onConfirm={page.confirmBulkDeleteSelected}
      />

      <BulkActionsDialog
        open={page.bulkDialogAction === "disable-followup-selected"}
        onOpenChange={(open) => {
          if (!open && !page.isBulkMutating) page.setBulkDialogAction(null);
        }}
        title="Désactiver les relances ?"
        description={`Les relances automatiques seront désactivées pour ${page.selectedFollowUpCount} candidature${page.selectedFollowUpCount > 1 ? "s" : ""}. Vous pourrez les réactiver individuellement depuis le détail de chaque candidature.`}
        confirmLabel="Désactiver"
        pendingLabel="Désactivation..."
        isPending={page.isBulkMutating}
        onConfirm={page.disableFollowUpForSelected}
      />

      <BulkActionsDialog
        open={page.bulkDialogAction === "enable-followup-selected"}
        onOpenChange={(open) => {
          if (!open && !page.isBulkMutating) page.setBulkDialogAction(null);
        }}
        title="Réactiver les relances ?"
        description={`Les relances automatiques seront réactivées pour ${page.selectedFollowUpDisabledCount} candidature${page.selectedFollowUpDisabledCount > 1 ? "s" : ""}.`}
        confirmLabel="Réactiver"
        pendingLabel="Réactivation..."
        isPending={page.isBulkMutating}
        onConfirm={page.enableFollowUpForSelected}
      />

      <BulkActionsDialog
        open={page.bulkDialogAction === "change-status-selected"}
        onOpenChange={(open) => {
          if (!open && !page.isBulkMutating) {
            page.setBulkDialogAction(null);
            page.setBulkTargetStatus(null);
          }
        }}
        title="Changer le statut ?"
        description={`Le statut de ${page.selectedJobIds.size} candidature${page.selectedJobIds.size > 1 ? "s" : ""} sera modifié en « ${page.bulkTargetStatus ? applicationStatusLabel(page.bulkTargetStatus) : ""} ».`}
        confirmLabel="Confirmer"
        pendingLabel="Mise à jour..."
        isPending={page.isBulkMutating}
        onConfirm={page.confirmBulkChangeStatus}
      />
    </div>
  );
}
