"use client";

import { Suspense, useState } from "react";
import { SearchEngine, SearchState } from "@/components/search/SearchEngine";
import { FeaturedSearch } from "@/types/featuredSearch";
import { SearchHistoryPanel } from "@/features/jobs/components/SearchHistoryPanel";
import { ExportDialog } from "@/features/jobs/components/ExportDialog";
import { JobDetailsSheet } from "@/features/jobs/components/JobDetailsSheet";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { HomePageHero } from "@/features/jobs/components/HomePageHero";
import { HomeSearchResultsSection } from "@/features/jobs/components/HomeSearchResultsSection";
import { useHomePageState } from "@/features/jobs/hooks/useHomePageState";

function DashboardPageSkeleton() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6">
      <section className="grid gap-4 rounded-3xl border bg-card/70 p-6 shadow-sm lg:grid-cols-[minmax(0,1.3fr)_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-full max-w-3xl" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-44" />
          </div>
        </div>
        <div className="grid gap-3 rounded-2xl border bg-background/70 p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-28" />
              </div>
              <Skeleton className="h-16 w-full" />
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function DashboardPageContent() {
  const page = useHomePageState();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  if (!page.isPageReady) return <DashboardPageSkeleton />;

  const featuredSearches = page.featuredSearches ?? [];
  const availableFeaturedSearches = !page.isFeaturedSearchesLoading ? featuredSearches : [];
  const searchFormInitialState = page.urlQuery ?? { booleanMode: page.settings.defaultSearchMode };
  const searchFormKey = JSON.stringify(searchFormInitialState);

  const authPanel = !page.user ? (
    <Alert className="bg-card">
      <AlertTitle>Connectez-vous pour aller plus loin.</AlertTitle>
      <AlertDescription className="gap-3">
        <p>
          Le compte permet de suivre les candidatures, conserver l&apos;historique de recherche,
          retrouver vos données sur tous vos appareils et partager l&apos;avancement avec un coach.
        </p>
        <Button type="button" size="sm" onClick={() => page.setIsAuthRequiredOpen(true)}>
          Connexion / création de compte
        </Button>
      </AlertDescription>
    </Alert>
  ) : null;

  const replayHistory = async (query: SearchState) => {
    page.resetSelection();
    page.updateUrlFromQuery(query);
    await page.executeSearch(query, { persistInHistory: false });
  };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      {page.hasSearched ? (
        <>
          <SearchFormSection
            searchFormKey={searchFormKey}
            searchFormInitialState={searchFormInitialState}
            availableFeaturedSearches={availableFeaturedSearches}
            historyCount={page.user && page.isHistoryLoaded ? page.history.length : 0}
            onOpenHistory={
              page.user && page.isHistoryLoaded && page.history.length > 0
                ? () => setIsHistoryOpen(true)
                : undefined
            }
            onSearch={(state: SearchState) => page.handleSearch(state)}
            onRunFeaturedSearch={(item) => {
              void page.runFeaturedSearch(item);
            }}
            hasSearched
          />

          <HomeSearchResultsSection
            jobs={page.jobs}
            selectedJobs={page.selectedJobs}
            selectedJobIds={page.selectedJobIds}
            hasSearched={page.hasSearched}
            isSearching={page.isSearching}
            isLoadingMore={page.isLoadingMore}
            hasMoreResults={page.hasMoreResults}
            searchSessionId={page.searchSessionId}
            isAuthenticated={page.isApplicationAuth}
            isApplicationsLoaded={page.areApplicationsLoaded}
            jobsCount={page.jobs.length}
            selectedCount={page.selectedJobs.length}
            canCopySearchLink={Boolean(page.lastSearchQuery)}
            isApplied={page.isApplied}
            onLoadMore={page.loadMore}
            onOpenDetails={page.openJobDetails}
            onToggleSelection={page.toggleSelection}
            onResetSelection={page.resetSelection}
            onRemoveSelection={page.toggleSelection}
            onSendToApplications={() => {
              if (!page.user) {
                page.requestAuthForApplications(page.selectedJobs);
                return;
              }

              void page.trackJobs(page.selectedJobs).then(() => page.resetSelection());
            }}
            onExportAll={() => page.openExportDialog("all")}
            onExportSelected={() => page.openExportDialog("selected")}
            onCopySearchLink={page.handleCopySearchLink}
            onTrackApplication={async (job) => {
              await page.addApplication(job);
            }}
            onRequireAuth={(job) => page.requestAuthForApplications([job])}
          />

          {authPanel}
        </>
      ) : (
        <>
          <HomePageHero />

          <SearchFormSection
            searchFormKey={searchFormKey}
            searchFormInitialState={searchFormInitialState}
            availableFeaturedSearches={availableFeaturedSearches}
            historyCount={page.user && page.isHistoryLoaded ? page.history.length : 0}
            onOpenHistory={
              page.user && page.isHistoryLoaded && page.history.length > 0
                ? () => setIsHistoryOpen(true)
                : undefined
            }
            onSearch={(state: SearchState) => page.handleSearch(state)}
            onRunFeaturedSearch={(item) => {
              void page.runFeaturedSearch(item);
            }}
            hasSearched={false}
          />

          {authPanel}
        </>
      )}

      <ExportDialog
        open={page.isExportDialogOpen}
        onOpenChange={page.setIsExportDialogOpen}
        exportTarget={page.exportTarget}
        jobsCount={page.jobs.length}
        selectedCount={page.selectedJobs.length}
        selectedColumns={page.selectedExportColumns}
        onToggleColumn={page.toggleColumn}
        onSelectAllColumns={page.selectAllColumns}
        onExport={() =>
          page.applyExport({
            jobs: page.jobs,
            selectedJobs: page.selectedJobs,
            lastSearchQuery: page.lastSearchQuery,
          })
        }
      />

      <JobDetailsSheet
        job={page.selectedJob}
        open={page.isDetailsOpen}
        onOpenChange={page.setIsDetailsOpen}
        applied={page.selectedJob ? page.isApplied(page.selectedJob.id) : false}
        isAuthenticated={page.isApplicationAuth}
        isApplicationsLoaded={page.areApplicationsLoaded}
        onTrackApplication={async (job) => {
          await page.addApplication(job);
        }}
        onRequireAuth={() => {
          if (page.selectedJob) {
            page.requestAuthForApplications([page.selectedJob]);
          } else {
            page.setIsAuthRequiredOpen(true);
          }
        }}
      />

      <AuthRequiredDialog
        open={page.isAuthRequiredOpen}
        onOpenChange={page.setIsAuthRequiredOpen}
        onSuccess={page.replayPendingApplications}
      />

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historique récent</DialogTitle>
            <DialogDescription>
              Rejouez une recherche précédente sans surcharger la page principale.
            </DialogDescription>
          </DialogHeader>
          {page.user && page.isHistoryLoaded ? (
            <SearchHistoryPanel
              history={page.history}
              maxVisible={4}
              onReplay={async (query) => {
                await replayHistory(query);
                setIsHistoryOpen(false);
              }}
              onClear={page.clearHistory}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SearchFormSection({
  searchFormKey,
  searchFormInitialState,
  availableFeaturedSearches,
  historyCount,
  onOpenHistory,
  onSearch,
  onRunFeaturedSearch,
  hasSearched,
}: {
  searchFormKey: string;
  searchFormInitialState: Partial<SearchState>;
  availableFeaturedSearches: FeaturedSearch[];
  historyCount: number;
  onOpenHistory?: () => void;
  onSearch: (state: SearchState) => void;
  onRunFeaturedSearch: (item: FeaturedSearch) => void;
  hasSearched: boolean;
}) {
  const engine = (
    <SearchEngine
      key={searchFormKey}
      onSearch={onSearch}
      initialState={searchFormInitialState}
      featuredSearches={availableFeaturedSearches}
      onRunFeaturedSearch={onRunFeaturedSearch}
      historyCount={historyCount}
      onOpenHistory={onOpenHistory}
    />
  );

  if (hasSearched) {
    return (
      <section className="flex flex-col gap-4 rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">
            Recherche d&apos;offres
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reprenez la recherche ou affinez-la.
          </h1>
        </div>
        {engine}
      </section>
    );
  }

  return engine;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}
