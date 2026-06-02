"use client";

import { Job } from "@/types/job";
import { JobTable } from "@/components/jobs/JobTable";
import { ForemDataAttribution } from "@/features/jobs/components/ForemDataAttribution";
import { ResultsToolbar } from "@/features/jobs/components/ResultsToolbar";
import { SelectionPanel } from "@/features/jobs/components/SelectionPanel";

interface HomeSearchResultsSectionProps {
  jobs: Job[];
  selectedJobs: Job[];
  selectedJobIds: Set<string>;
  hasSearched: boolean;
  isSearching: boolean;
  isLoadingMore: boolean;
  hasMoreResults: boolean;
  searchSessionId: number;
  isAuthenticated: boolean;
  isApplicationsLoaded: boolean;
  jobsCount: number;
  selectedCount: number;
  canCopySearchLink: boolean;
  isApplied: (jobId: string) => boolean;
  onLoadMore: () => void;
  onOpenDetails: (job: Job) => void;
  onToggleSelection: (job: Job) => void;
  onResetSelection: () => void;
  onRemoveSelection: (job: Job) => void;
  onSendToApplications: () => void;
  onExportAll: () => void;
  onExportSelected: () => void;
  onCopySearchLink: () => Promise<void> | void;
  onTrackApplication: (job: Job) => Promise<void> | void;
  onRequireAuth: (job: Job) => void;
}

export function HomeSearchResultsSection({
  jobs,
  selectedJobs,
  selectedJobIds,
  hasSearched,
  isSearching,
  isLoadingMore,
  hasMoreResults,
  searchSessionId,
  isAuthenticated,
  isApplicationsLoaded,
  jobsCount,
  selectedCount,
  canCopySearchLink,
  isApplied,
  onLoadMore,
  onOpenDetails,
  onToggleSelection,
  onResetSelection,
  onRemoveSelection,
  onSendToApplications,
  onExportAll,
  onExportSelected,
  onCopySearchLink,
  onTrackApplication,
  onRequireAuth,
}: HomeSearchResultsSectionProps) {
  if (!hasSearched) {
    return null;
  }

  const hasForemJobs = jobs.some((job) => job.source === "forem");

  return (
    <section className="flex flex-col gap-4">
      <SelectionPanel
        selectedJobs={selectedJobs}
        onReset={onResetSelection}
        onRemove={onRemoveSelection}
        onSendToApplications={onSendToApplications}
      />

      <div className="overflow-hidden rounded-[24px] border border-border/60 bg-card shadow-sm">
        <ResultsToolbar
          jobsCount={jobsCount}
          selectedCount={selectedCount}
          isSearching={isSearching}
          onExportAll={onExportAll}
          onExportSelected={onExportSelected}
          onCopySearchLink={onCopySearchLink}
          canCopySearchLink={canCopySearchLink}
        />

        <div className="p-4 sm:p-5">
          {isSearching ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-[20px] bg-linear-to-br from-muted/10 to-muted/30">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="animate-pulse font-medium text-muted-foreground">
                Le FOREM-fouille analyse les offres...
              </p>
            </div>
          ) : (
            <JobTable
              data={jobs}
              resetPaginationToken={searchSessionId}
              isLoadingMore={isLoadingMore}
              hasMoreResults={hasMoreResults}
              onLoadMore={onLoadMore}
              selectedJobIds={selectedJobIds}
              onToggleSelection={onToggleSelection}
              onOpenDetails={onOpenDetails}
              isAuthenticated={isAuthenticated}
              isApplicationsLoaded={isApplicationsLoaded}
              isApplied={isApplied}
              onTrackApplication={onTrackApplication}
              onRequireAuth={onRequireAuth}
            />
          )}
        </div>

        {hasForemJobs ? (
          <div className="border-t border-border/60 px-4 py-3 sm:px-5">
            <ForemDataAttribution compact />
          </div>
        ) : null}
      </div>
    </section>
  );
}
