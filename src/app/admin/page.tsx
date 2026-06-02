"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookLock,
  FileWarning,
  History,
  KeyRound,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useToastFeedback } from "@/hooks/useToastFeedback";
import { CoachAdminSection } from "@/features/coach/components/CoachAdminSection";
import { useAdminPageState } from "@/features/admin/useAdminPageState";
import { AdminAccountDeletionRequestsSection } from "@/features/admin/components/AdminAccountDeletionRequestsSection";
import { AdminApiKeysSection } from "@/features/admin/components/AdminApiKeysSection";
import { AdminComplianceSection } from "@/features/admin/components/AdminComplianceSection";
import { AdminFeaturedSearchesSection } from "@/features/admin/components/AdminFeaturedSearchesSection";
import { AdminAuditLogsSection } from "@/features/admin/components/AdminAuditLogsSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Users;
}) {
  return (
    <Card className="border-border/60 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-col gap-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-3xl font-black tracking-tight">{value}</CardTitle>
        </div>
        <div className="rounded-full border border-border/60 bg-muted/30 p-3">
          <Icon className="text-primary" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 text-sm text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  );
}

const ADMIN_SECTIONS = [
  { id: "coachs", label: "Coachs", icon: Users },
  { id: "recherches", label: "Recherches", icon: Search },
  { id: "cles-api", label: "Clés API", icon: KeyRound },
  { id: "suppression-comptes", label: "Suppressions", icon: FileWarning },
  { id: "conformite", label: "Conformité", icon: BookLock },
  { id: "audit", label: "Audit", icon: History },
] as const;

function AdminPageSkeleton() {
  return (
    <div className="mx-auto flex min-w-0 max-w-6xl flex-col gap-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-56" />
            </div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-full max-w-3xl" />
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  const page = useAdminPageState();
  const [isLegalHoldDialogOpen, setIsLegalHoldDialogOpen] = useState(false);
  const [legalHoldDraft, setLegalHoldDraft] = useState<{
    targetType: "user" | "conversation" | "application";
    targetId: number | null;
  } | null>(null);
  const isInitialPageLoading = page.isAuthLoading || (page.isLoading && !page.dashboard);

  const legalHoldUserTargets = useMemo(
    () =>
      (page.dashboard?.users ?? []).map((entry) => ({
        id: entry.id,
        email: entry.email,
        firstName: entry.firstName,
        lastName: entry.lastName,
        role: entry.role,
      })),
    [page.dashboard?.users]
  );

  const handleLegalHoldDialogOpenChange = useCallback((open: boolean) => {
    setIsLegalHoldDialogOpen(open);
    if (!open) {
      setLegalHoldDraft(null);
    }
  }, []);

  const openUserLegalHoldDialog = useCallback((userId: number) => {
    setLegalHoldDraft({
      targetType: "user",
      targetId: userId,
    });
    setIsLegalHoldDialogOpen(true);
  }, []);

  useToastFeedback(page.feedback, { title: "Administration" });
  useToastFeedback(page.apiKeysFeedback, { title: "Clés API admin" });
  useToastFeedback(page.featuredSearchesFeedback, { title: "Recherches mises en avant" });
  useToastFeedback(page.deletionRequestsFeedback, { title: "Demandes de suppression" });
  useToastFeedback(page.legalHoldsFeedback, { title: "Legal holds" });
  useToastFeedback(page.disclosureLogsFeedback, { title: "Disclosure logs" });
  useToastFeedback(page.auditLogsFeedback, { title: "Audit logs" });

  if (isInitialPageLoading) {
    return <AdminPageSkeleton />;
  }

  if (!page.user || !page.isAuthorized) {
    return (
      <Card className="mx-auto max-w-3xl gap-0 py-0">
        <CardContent className="p-8">
          <h1 className="text-2xl font-black tracking-tight">Accès réservé</h1>
          <p className="mt-2 text-muted-foreground">
            Cette page est réservée aux comptes `admin`.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex min-w-0 max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <Card className="overflow-hidden border-border/60 bg-card py-0">
        <CardHeader className="gap-5 border-b border-border/60 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">admin</Badge>
                <Badge variant="outline" className="h-auto max-w-full whitespace-normal py-1 text-left">
                  Pilotage des rôles et des accès API
                </Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
                  Administration
                </CardTitle>
                <CardDescription className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                  Espace dédié aux opérations sensibles: gestion des coachs, visibilité globale
                  des clés Bearer et révocation centralisée sans surcharger l&apos;espace `/coach`.
                </CardDescription>
              </div>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-3 lg:w-auto lg:min-w-[420px]">
              {ADMIN_SECTIONS.map(({ id, label, icon: Icon }) => (
                <Button key={id} asChild variant="outline" className="justify-between bg-card/80">
                  <a href={`#${id}`}>
                    <span className="inline-flex items-center gap-2">
                      <Icon data-icon="inline-start" />
                      {label}
                    </span>
                    <ArrowRight data-icon="inline-end" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Le suivi opérationnel reste disponible dans{" "}
            <Link href="/coach" className="text-primary hover:underline">
              l&apos;espace coach
            </Link>
            . Cette page concentre uniquement les fonctions d&apos;administration.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Coachs actifs"
          value={page.managedCoaches.length}
          description="Comptes actuellement promus au rôle coach."
          icon={Users}
        />
        <SummaryCard
          title="Suppressions en attente"
          value={page.deletionRequests.filter((entry) => entry.status === "pending").length}
          description="Demandes nécessitant encore une décision admin."
          icon={FileWarning}
        />
        <SummaryCard
          title="Clés actives"
          value={page.apiKeyStats.active}
          description="Clés Bearer non révoquées et encore valides."
          icon={KeyRound}
        />
        <SummaryCard
          title="Legal holds"
          value={page.legalHolds.length}
          description="Gels actifs bloquant une suppression ou une purge."
          icon={ShieldCheck}
        />
      </div>

      <div id="recherches">
        <AdminFeaturedSearchesSection
          featuredSearches={page.featuredSearches}
          isLoading={page.isFeaturedSearchesLoading}
          isSaving={page.isSavingFeaturedSearch}
          savingId={page.savingFeaturedSearchId}
          isDeleting={page.isDeletingFeaturedSearch}
          onRefresh={() => void page.loadFeaturedSearches()}
          onCreate={(payload) => page.createFeaturedSearch(payload)}
          onUpdate={(id, payload) => page.updateFeaturedSearch(id, payload)}
          onDelete={(id) => page.deleteFeaturedSearch(id)}
        />
      </div>

      <div id="coachs">
        <CoachAdminSection
          coaches={page.managedCoaches}
          groups={page.dashboard?.groups ?? []}
          promotableUsers={page.promotableUsers}
          isPromoteCoachOpen={page.isPromoteCoachOpen}
          onPromoteCoachOpenChange={page.setIsPromoteCoachOpen}
          onPromoteCoach={(userId) => void page.promoteCoach(userId)}
          onDemoteCoach={(userId) => void page.demoteCoach(userId)}
        />
      </div>

      <AdminApiKeysSection
        apiKeys={page.apiKeys}
        isLoading={page.isApiKeysLoading}
        isRevoking={page.isRevokingApiKey}
        revokeTarget={page.revokeTarget}
        onRefresh={() => void page.loadApiKeys()}
        onRevokeRequest={page.setRevokeTarget}
        onRevokeConfirm={() => void page.revokeApiKey()}
        onRevokeDialogOpenChange={(open) => !open && page.setRevokeTarget(null)}
      />

      <div id="suppression-comptes">
        <AdminAccountDeletionRequestsSection
          requests={page.deletionRequests}
          isLoading={page.isDeletionRequestsLoading}
          reviewingId={page.reviewingDeletionRequestId}
          onRefresh={() => void page.loadDeletionRequests()}
          onRequestLegalHold={(user) => openUserLegalHoldDialog(user.id)}
          onReview={(input) => page.reviewDeletionRequest(input)}
        />
      </div>

      <div id="conformite">
        <AdminComplianceSection
          userTargets={legalHoldUserTargets}
          legalHolds={page.legalHolds}
          disclosureLogs={page.disclosureLogs}
          legalHoldDialogOpen={isLegalHoldDialogOpen}
          onLegalHoldDialogOpenChange={handleLegalHoldDialogOpenChange}
          legalHoldDraft={legalHoldDraft}
          isLegalHoldsLoading={page.isLegalHoldsLoading}
          isDisclosureLogsLoading={page.isDisclosureLogsLoading}
          isCreatingLegalHold={page.isCreatingLegalHold}
          isReleasingLegalHold={page.isReleasingLegalHold}
          isCreatingDisclosureLog={page.isCreatingDisclosureLog}
          onRefreshLegalHolds={() => void page.loadLegalHolds()}
          onRefreshDisclosureLogs={() => void page.loadDisclosureLogs()}
          onCreateLegalHold={(payload) => page.createLegalHold(payload)}
          onReleaseLegalHold={(id) => page.releaseLegalHold(id)}
          onCreateDisclosureLog={(payload) => page.createDisclosureLog(payload)}
        />
      </div>

      <AdminAuditLogsSection
        auditLogs={page.auditLogs}
        isLoading={page.isAuditLogsLoading}
        onRefresh={() => void page.loadAuditLogs()}
      />
    </div>
  );
}
