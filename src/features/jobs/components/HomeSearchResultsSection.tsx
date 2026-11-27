"use client";

import { Job } from "@/types/job";
import type { SearchFilters, SearchSort } from "@/types/search";
import { JobTable } from "@/components/jobs/JobTable";
import { ForemDataAttribution } from "@/features/jobs/components/ForemDataAttribution";
import { ResultsToolbar } from "@/features/jobs/components/ResultsToolbar";
import { SearchFiltersBar } from "@/features/jobs/components/SearchFiltersBar";
import { SelectionPanel } from "@/features/jobs/components/SelectionPanel";

interface HomeSearchResultsSectionProps {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  sort: SearchSort;
  filters: SearchFilters;
  selectedJobs: Job[];
  selectedJobIds: Set<string>;
  hasSearched: boolean;
  isSearching: boolean;
  isAuthenticated: boolean;
  isApplicationsLoaded: boolean;
  selectedCount: number;
  canCopySearchLink: boolean;
  hasKeywords: boolean;
  isApplied: (jobId: string) => boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (sort: SearchSort) => void;
  onFiltersChange: (filters: SearchFilters) => void;
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
  total,
  page,
  pageSize,
  sort,
  filters,
  selectedJobs,
  selectedJobIds,
  hasSearched,
  isSearching,
  isAuthenticated,
  isApplicationsLoaded,
  selectedCount,
  canCopySearchLink,
  hasKeywords,
  isApplied,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFiltersChange,
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
          jobsCount={total}
          selectedCount={selectedCount}
          isSearching={isSearching}
          onExportAll={onExportAll}
          onExportSelected={onExportSelected}
          onCopySearchLink={onCopySearchLink}
          canCopySearchLink={canCopySearchLink}
        />

        <div className="flex flex-col gap-3 px-4 pt-3 sm:px-5">
          <SearchFiltersBar
            sort={sort}
            onSortChange={onSortChange}
            filters={filters}
            onFiltersChange={onFiltersChange}
            hasKeywords={hasKeywords}
            disabled={isSearching}
          />
        </div>

        <div className="p-4 sm:p-5">
          {isSearching ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-[20px] bg-linear-to-br from-muted/10 to-muted/30">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="animate-pulse font-medium text-muted-foreground">
                Analyse des offres en cours...
              </p>
            </div>
          ) : (
            <JobTable
              data={jobs}
              totalCount={total}
              pageIndex={page}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              isLoading={isSearching}
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
