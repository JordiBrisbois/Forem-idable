"use client";

import { MapPin, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { ScoutForm } from "@/features/scout/components/ScoutForm";
import { ScoutProgressPanel } from "@/features/scout/components/ScoutProgressPanel";
import { ScoutResultsTable } from "@/features/scout/components/ScoutResultsTable";
import { ScoutJobHistory } from "@/features/scout/components/ScoutJobHistory";
import { ScoutJobHistoryDrawer } from "@/features/scout/components/ScoutJobHistoryDrawer";
import { useScoutPageState } from "@/features/scout/hooks/useScoutPageState";
import { ScoutResult } from "@/features/scout/scoutSchemas";

export default function ScoutPage() {
  const { user } = useAuth();
  const page = useScoutPageState();


  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold">Connexion requise</h1>
            <p className="mt-2 text-muted-foreground">
              Connectez-vous pour utiliser le Scout.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApply = (result: ScoutResult) => {
    const params = new URLSearchParams({
      company: result.name,
      url: result.website ?? "",
      location: result.address ?? result.town ?? "",
    });
    window.open(`/applications?${params.toString()}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black tracking-tight">Scout</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Découvrez des entreprises autour d&apos;une ville via OpenStreetMap.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Form + Progress + Results */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Search Form */}
          <ScoutForm onSubmit={page.startJob} isLoading={page.isSubmitting} />

          {/* Progress Panel (shown during search) */}
          {page.progress && (
            <ScoutProgressPanel
              step={page.progress.step}
              total={page.progress.total}
              found={page.progress.found}
              message={page.progress.message}
            />
          )}

          {/* Results Table */}
          {(page.activeJob?.status === "completed" || page.results.length > 0) && (
            <ScoutResultsTable results={page.results} onApply={handleApply} />
          )}
        </div>

        {/* Right Column: Job History Sidebar */}
        <div className="flex min-w-0 flex-col gap-6">
          <ScoutJobHistory
            jobs={page.jobs}
            activeJobId={page.activeJob?.id}
            onSelect={(job) => page.loadJobDetail(job.id)}
            onDelete={(jobId) => page.removeJob(jobId)}
            onOpenHistory={page.openHistory}
          />

          {/* Mobile-only "View All History" button */}
          <Button
            variant="outline"
            className="lg:hidden flex items-center gap-2"
            onClick={page.openHistory}
          >
            <History className="h-4 w-4" />
            Voir tout l&apos;historique
          </Button>
        </div>
      </div>

      {/* Full History Drawer */}
      <ScoutJobHistoryDrawer
        open={page.isHistoryOpen}
        onOpenChange={page.closeHistory}
        jobs={page.jobs}
        activeJobId={page.activeJob?.id}
        onSelect={(job) => page.loadJobDetail(job.id)}
        onDelete={(jobId) => page.removeJob(jobId)}
      />
    </div>
  );
}
