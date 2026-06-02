"use client";

import { useMemo, useState } from "react";
import { BookLock, FilePlus2, Hand, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { LocalPagination } from "@/components/ui/local-pagination";
import { AdminDisclosureLog, AdminLegalHold } from "@/features/admin/adminApi";
import { AdminLegalHoldDialog } from "./AdminLegalHoldDialog";
import { AdminDisclosureLogDialog } from "./AdminDisclosureLogDialog";
import {
  AdminLegalHoldUserTarget,
  formatDateTime,
  formatDisclosureRequestType,
  formatDisclosureTargetType,
  formatLegalHoldTarget,
} from "./complianceUtils";

type AdminComplianceSectionProps = {
  userTargets: AdminLegalHoldUserTarget[];
  legalHolds: AdminLegalHold[];
  disclosureLogs: AdminDisclosureLog[];
  legalHoldDialogOpen: boolean;
  onLegalHoldDialogOpenChange: (open: boolean) => void;
  legalHoldDraft: {
    targetType: "user" | "conversation" | "application";
    targetId: number | null;
  } | null;
  isLegalHoldsLoading: boolean;
  isDisclosureLogsLoading: boolean;
  isCreatingLegalHold: boolean;
  isReleasingLegalHold: boolean;
  isCreatingDisclosureLog: boolean;
  onRefreshLegalHolds: () => void;
  onRefreshDisclosureLogs: () => void;
  onCreateLegalHold: (payload: {
    targetType: "user" | "conversation" | "application";
    targetId: number;
    reason: string;
  }) => Promise<boolean>;
  onReleaseLegalHold: (id: number) => Promise<boolean>;
  onCreateDisclosureLog: (payload: {
    requestType?: "authority_request" | "litigation" | "other";
    authorityName: string;
    legalBasis?: string;
    targetType: "user" | "conversation" | "application" | "export" | "other";
    targetId?: number;
    scopeSummary: string;
    exportReference?: string;
  }) => Promise<boolean>;
};

export function AdminComplianceSection({
  userTargets,
  legalHolds,
  disclosureLogs,
  legalHoldDialogOpen,
  onLegalHoldDialogOpenChange,
  legalHoldDraft,
  isLegalHoldsLoading,
  isDisclosureLogsLoading,
  isCreatingLegalHold,
  isReleasingLegalHold,
  isCreatingDisclosureLog,
  onRefreshLegalHolds,
  onRefreshDisclosureLogs,
  onCreateLegalHold,
  onReleaseLegalHold,
  onCreateDisclosureLog,
}: AdminComplianceSectionProps) {
  const [isDisclosureDialogOpen, setIsDisclosureDialogOpen] = useState(false);
  const [legalHoldPage, setLegalHoldPage] = useState(1);
  const [disclosurePage, setDisclosurePage] = useState(1);

  const legalHoldPageSize = 5;
  const disclosurePageSize = 5;

  const legalHoldPageCount = Math.max(1, Math.ceil(legalHolds.length / legalHoldPageSize));
  const disclosurePageCount = Math.max(1, Math.ceil(disclosureLogs.length / disclosurePageSize));

  const visibleLegalHolds = useMemo(
    () =>
      legalHolds.slice(
        (legalHoldPage - 1) * legalHoldPageSize,
        legalHoldPage * legalHoldPageSize
      ),
    [legalHoldPage, legalHolds]
  );

  const visibleDisclosureLogs = useMemo(
    () =>
      disclosureLogs.slice(
        (disclosurePage - 1) * disclosurePageSize,
        disclosurePage * disclosurePageSize
      ),
    [disclosureLogs, disclosurePage]
  );

  return (
    <>
      <Card className="gap-0 border-border/60 bg-card py-0">
        <CardHeader className="border-b border-border/60 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl">Conformité</CardTitle>
              <CardDescription>
                Outils de gel légal et journalisation des divulgations ciblées.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={onRefreshLegalHolds}>
                Actualiser les legal holds
              </Button>
              <Button type="button" variant="outline" onClick={onRefreshDisclosureLogs}>
                Actualiser les logs
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 px-5 py-5 xl:grid-cols-2">
          <Card className="gap-0 border-border/60 py-0 shadow-none">
            <CardHeader className="border-b border-border/60 px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Hand data-icon="inline-start" />
                    Legal Holds
                  </CardTitle>
                  <CardDescription>
                    Geler une suppression ou une purge ciblée tant qu&apos;une contrainte s&apos;applique.
                  </CardDescription>
                </div>
                  <Button type="button" onClick={() => onLegalHoldDialogOpenChange(true)}>
                    <ShieldAlert data-icon="inline-start" />
                    Ajouter
                  </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 py-5">
              {isLegalHoldsLoading ? (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                  Chargement des legal holds...
                </div>
              ) : legalHolds.length === 0 ? (
                <Empty className="min-h-44 rounded-xl border border-dashed border-border/60">
                  <EmptyHeader>
                    <EmptyTitle>Aucun legal hold actif.</EmptyTitle>
                    <EmptyDescription>
                      Ajoute un gel ciblé lorsqu&apos;une suppression doit être suspendue.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <div className="grid gap-3">
                    {visibleLegalHolds.map((hold) => (
                      <div
                        key={hold.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{formatLegalHoldTarget(hold.targetType)}</Badge>
                            <Badge variant="outline">ID {hold.targetId}</Badge>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isReleasingLegalHold}
                            onClick={() => void onReleaseLegalHold(hold.id)}
                          >
                            <ShieldCheck data-icon="inline-start" />
                            Libérer
                          </Button>
                        </div>
                        <p className="text-sm text-foreground">{hold.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          Créé le {formatDateTime(hold.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <LocalPagination
                    currentPage={legalHoldPage}
                    pageCount={legalHoldPageCount}
                    totalCount={legalHolds.length}
                    pageSize={legalHoldPageSize}
                    itemLabel="legal holds"
                    compact
                    onPageChange={setLegalHoldPage}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 border-border/60 py-0 shadow-none">
            <CardHeader className="border-b border-border/60 px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookLock data-icon="inline-start" />
                    Disclosure Logs
                  </CardTitle>
                  <CardDescription>
                    Historique des divulgations ciblées et de leur base légale.
                  </CardDescription>
                </div>
                <Button type="button" onClick={() => setIsDisclosureDialogOpen(true)}>
                  <FilePlus2 data-icon="inline-start" />
                  Journaliser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 py-5">
              {isDisclosureLogsLoading ? (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                  Chargement des disclosure logs...
                </div>
              ) : disclosureLogs.length === 0 ? (
                <Empty className="min-h-44 rounded-xl border border-dashed border-border/60">
                  <EmptyHeader>
                    <EmptyTitle>Aucune divulgation journalisée.</EmptyTitle>
                    <EmptyDescription>
                      Ajoute une entrée lorsqu&apos;une extraction ciblée est remise à une autorité.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <div className="grid gap-3">
                    {visibleDisclosureLogs.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {formatDisclosureRequestType(entry.requestType)}
                          </Badge>
                          <Badge variant="outline">
                            {formatDisclosureTargetType(entry.targetType)}
                            {entry.targetId ? ` #${entry.targetId}` : ""}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1 text-sm">
                          <p className="font-medium text-foreground">{entry.authorityName}</p>
                          <p className="text-muted-foreground">{entry.scopeSummary}</p>
                          {entry.legalBasis ? (
                            <p className="text-xs text-muted-foreground">
                              Base légale: {entry.legalBasis}
                            </p>
                          ) : null}
                          {entry.exportReference ? (
                            <p className="text-xs text-muted-foreground">
                              Référence export: {entry.exportReference}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            Créé le {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <LocalPagination
                    currentPage={disclosurePage}
                    pageCount={disclosurePageCount}
                    totalCount={disclosureLogs.length}
                    pageSize={disclosurePageSize}
                    itemLabel="logs"
                    compact
                    onPageChange={setDisclosurePage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <AdminLegalHoldDialog
        open={legalHoldDialogOpen}
        onOpenChange={onLegalHoldDialogOpenChange}
        isCreating={isCreatingLegalHold}
        userTargets={userTargets}
        legalHoldDraft={legalHoldDraft}
        onCreateLegalHold={onCreateLegalHold}
      />

      <AdminDisclosureLogDialog
        open={isDisclosureDialogOpen}
        onOpenChange={setIsDisclosureDialogOpen}
        isCreating={isCreatingDisclosureLog}
        onCreateDisclosureLog={onCreateDisclosureLog}
      />
    </>
  );
}
