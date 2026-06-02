"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { KeyRound, RotateCw, ShieldBan } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FilterToggleGroup } from "@/components/ui/filter-toggle-group";
import { Input } from "@/components/ui/input";
import { LocalPagination } from "@/components/ui/local-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CoachConfirmationDialog } from "@/features/coach/components/dialogs/CoachConfirmationDialog";
import { formatCoachDate, getCoachUserDisplayName } from "@/features/coach/utils";
import { cn } from "@/lib/utils";
import { AdminApiKeySummary } from "@/types/externalApi";

type ApiKeyStatusFilter = "all" | "active" | "revoked" | "expired" | "expiring";

function getApiKeyStatus(entry: AdminApiKeySummary) {
  if (entry.revokedAt) return "revoked";
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now()) return "expired";
  if (entry.expiresAt) {
    const expiresAt = new Date(entry.expiresAt).getTime();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    if (expiresAt - Date.now() <= fourteenDays) return "expiring";
  }
  return "active";
}

function getAdminApiKeyOwnerName(entry: AdminApiKeySummary) {
  return getCoachUserDisplayName({
    firstName: entry.userFirstName,
    lastName: entry.userLastName,
    email: entry.userEmail,
  });
}

function getStatusBadge(entry: AdminApiKeySummary) {
  const status = getApiKeyStatus(entry);

  switch (status) {
    case "revoked":
      return <Badge variant="destructive">Révoquée</Badge>;
    case "expired":
      return <Badge variant="outline">Expirée</Badge>;
    case "expiring":
      return <Badge variant="secondary">Expire bientôt</Badge>;
    case "active":
    default:
      return <Badge variant="secondary">Active</Badge>;
  }
}

function ApiKeyMobileCard({
  entry,
  onRevokeRequest,
}: {
  entry: AdminApiKeySummary;
  onRevokeRequest: (entry: AdminApiKeySummary) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/90 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium break-words">{getAdminApiKeyOwnerName(entry)}</p>
              <Badge variant="outline" className="capitalize">
                {entry.userRole}
              </Badge>
            </div>
            <p className="mt-1 break-all text-xs text-muted-foreground">{entry.userEmail}</p>
            <p className="mt-1 text-xs text-muted-foreground">{entry.name}</p>
          </div>
          {getStatusBadge(entry)}
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cle
            </span>
            <code className="break-all text-xs">
              {entry.keyPrefix}...{entry.lastFour}
            </code>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Creee le
            </span>
            <span>{formatCoachDate(entry.createdAt, true)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Dernier usage
            </span>
            <span>{entry.lastUsedAt ? formatCoachDate(entry.lastUsedAt, true) : "Jamais"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Expiration
            </span>
            <span>
              {entry.expiresAt ? formatCoachDate(entry.expiresAt, true) : "Sans expiration"}
            </span>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          disabled={Boolean(entry.revokedAt)}
          onClick={() => onRevokeRequest(entry)}
        >
          <ShieldBan data-icon="inline-start" />
          Revoquer
        </Button>
      </div>
    </div>
  );
}

export function AdminApiKeysSection({
  apiKeys,
  isLoading,
  isRevoking,
  revokeTarget,
  onRefresh,
  onRevokeRequest,
  onRevokeConfirm,
  onRevokeDialogOpenChange,
}: {
  apiKeys: AdminApiKeySummary[];
  isLoading: boolean;
  isRevoking: boolean;
  revokeTarget: AdminApiKeySummary | null;
  onRefresh: () => void;
  onRevokeRequest: (entry: AdminApiKeySummary) => void;
  onRevokeConfirm: () => void;
  onRevokeDialogOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ApiKeyStatusFilter>("active");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const filteredKeys = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return apiKeys.filter((entry) => {
      const entryStatus = getApiKeyStatus(entry);
      if (status !== "all" && entryStatus !== status) {
        // "expiring" keys are still functionally active
        if (!(status === "active" && entryStatus === "expiring")) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        entry.name,
        entry.userEmail,
        entry.userFirstName,
        entry.userLastName,
        getAdminApiKeyOwnerName(entry),
        entry.keyPrefix,
        entry.lastFour,
        entry.userRole,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [apiKeys, deferredSearch, status]);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredKeys.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleKeys = useMemo(
    () => filteredKeys.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredKeys, safePage]
  );
  const statusCounts = useMemo(
    () => ({
      all: apiKeys.length,
      active: apiKeys.filter((entry) => getApiKeyStatus(entry) === "active").length,
      expiring: apiKeys.filter((entry) => getApiKeyStatus(entry) === "expiring").length,
      expired: apiKeys.filter((entry) => getApiKeyStatus(entry) === "expired").length,
      revoked: apiKeys.filter((entry) => getApiKeyStatus(entry) === "revoked").length,
    }),
    [apiKeys]
  );
  const statusOptions = [
    { value: "active" as const, label: `Actives (${statusCounts.active})` },
    { value: "all" as const, label: `Toutes (${statusCounts.all})` },
    { value: "expiring" as const, label: `Expirent bientôt (${statusCounts.expiring})` },
    { value: "expired" as const, label: `Expirées (${statusCounts.expired})` },
    { value: "revoked" as const, label: `Révoquées (${statusCounts.revoked})` },
  ];
  const hasKeys = filteredKeys.length > 0;
  const isInitialLoading = isLoading && apiKeys.length === 0;

  return (
    <>
      <Card id="cles-api" className="min-w-0 overflow-hidden border-border/60 py-0">
        <CardHeader className="gap-4 border-b border-border/60 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <KeyRound data-icon="inline-start" className="text-primary" />
                Clés API Bearer
              </CardTitle>
              <CardDescription>
                Inventaire global des clés générées. Les valeurs restent masquées, avec suivi du
                dernier usage, de l&apos;expiration et révocation centralisée.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={isLoading}>
              <RotateCw
                data-icon="inline-start"
                className={isLoading ? "animate-spin" : undefined}
              />
              {isLoading ? "Actualisation..." : "Rafraîchir"}
            </Button>
          </div>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="admin-api-key-search">Recherche</FieldLabel>
              <Input
                id="admin-api-key-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Nom, email, rôle, préfixe..."
              />
            </Field>
            <Field>
              <FieldLabel>Statut</FieldLabel>
              <FilterToggleGroup
                options={statusOptions}
                value={status}
                onValueChange={(value) => {
                  setStatus(value as ApiKeyStatusFilter);
                  setPage(1);
                }}
                renderIcon={(option) =>
                  option.value === "all" ? <KeyRound data-icon="inline-start" /> : null
                }
              />
            </Field>
          </FieldGroup>
        </CardHeader>

        <CardContent className="px-4 py-4 sm:px-6">
          {isInitialLoading ? (
            <div className="rounded-xl border border-border/60 px-6 py-8 text-sm text-muted-foreground">
              Chargement des clés API...
            </div>
          ) : !hasKeys ? (
            <Empty className="min-h-52 rounded-xl border border-dashed border-border/60">
              <EmptyHeader>
                <EmptyTitle>Aucune clé à afficher.</EmptyTitle>
                <EmptyDescription>
                  Ajuste les filtres ou génère des clés depuis les comptes coach/admin.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div
              aria-busy={isLoading}
              className={cn(
                "min-w-0 rounded-xl border border-border/60 bg-background/80 transition-opacity",
                isLoading ? "opacity-80" : "opacity-100"
              )}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {filteredKeys.length} clé{filteredKeys.length > 1 ? "s" : ""} affichée
                  {filteredKeys.length > 1 ? "s" : ""}
                </p>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <RotateCw className="animate-spin" />
                    Mise à jour en cours...
                  </span>
                ) : null}
              </div>
              <div className="grid gap-3 px-3 py-3 md:hidden">
                {visibleKeys.map((entry) => (
                  <ApiKeyMobileCard
                    key={entry.id}
                    entry={entry}
                    onRevokeRequest={onRevokeRequest}
                  />
                ))}
              </div>
              <div className="hidden min-w-0 px-2 py-2 md:block md:px-3">
                <Table className="min-w-[760px]">
                  <TableCaption className="sr-only">
                    Inventaire des clés API générées côté administration.
                  </TableCaption>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Clé</TableHead>
                      <TableHead>Créée le</TableHead>
                      <TableHead>Dernier usage</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleKeys.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="align-top">
                          <div className="flex min-w-44 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{getAdminApiKeyOwnerName(entry)}</span>
                              <Badge variant="outline" className="capitalize">
                                {entry.userRole}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{entry.userEmail}</span>
                            <span className="text-xs text-muted-foreground">{entry.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <code className="text-xs">
                            {entry.keyPrefix}...{entry.lastFour}
                          </code>
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          {formatCoachDate(entry.createdAt, true)}
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          {entry.lastUsedAt ? formatCoachDate(entry.lastUsedAt, true) : "Jamais"}
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          {entry.expiresAt
                            ? formatCoachDate(entry.expiresAt, true)
                            : "Sans expiration"}
                        </TableCell>
                        <TableCell className="align-top">{getStatusBadge(entry)}</TableCell>
                        <TableCell className="align-top text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            disabled={Boolean(entry.revokedAt)}
                            onClick={() => onRevokeRequest(entry)}
                          >
                            <ShieldBan data-icon="inline-start" />
                            Révoquer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {hasKeys ? (
            <div className="mt-4">
              <LocalPagination
                currentPage={safePage}
                pageCount={pageCount}
                totalCount={filteredKeys.length}
                pageSize={pageSize}
                itemLabel="clés"
                compact
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CoachConfirmationDialog
        open={Boolean(revokeTarget)}
        title="Révoquer cette clé API ?"
        description={
          revokeTarget
            ? `La clé ${revokeTarget.name} (${revokeTarget.keyPrefix}...${revokeTarget.lastFour}) de ${revokeTarget.userEmail} sera invalidée immédiatement.`
            : "Cette clé sera invalidée immédiatement."
        }
        confirmLabel="Révoquer la clé"
        onOpenChange={onRevokeDialogOpenChange}
        onConfirm={onRevokeConfirm}
        isPending={isRevoking}
      />
    </>
  );
}
