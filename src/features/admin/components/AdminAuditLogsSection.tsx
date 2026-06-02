"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { History, RotateCw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { LocalPagination } from "@/components/ui/local-pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCoachDate, getCoachUserDisplayName } from "@/features/coach/utils";
import { AdminAuditLog } from "@/features/admin/adminApi";
import { cn } from "@/lib/utils";

function formatAuditAction(action: string) {
  return action.replaceAll("_", " ");
}

function formatAuditPayload(payload: Record<string, unknown>) {
  const keys = Object.keys(payload);
  if (keys.length === 0) return "Aucun détail complémentaire.";

  return JSON.stringify(payload, null, 2);
}

function getAuditUserLabel(user: AdminAuditLog["actor"] | AdminAuditLog["targetUser"]) {
  if (!user) return "N/A";
  return getCoachUserDisplayName(user);
}

function formatAuditDateTime(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  const parts = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!day || !month || !year || !hour || !minute) return "N/A";
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function truncateGroupName(name: string, maxLength = 14) {
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength - 1)}…`;
}

function AuditLogMobileCard({ entry }: { entry: AdminAuditLog }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/90 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium capitalize">{formatAuditAction(entry.action)}</p>
              <Badge variant="outline">#{entry.id}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground" title={formatCoachDate(entry.createdAt, true)}>
              {formatAuditDateTime(entry.createdAt)}
            </p>
          </div>
          {entry.actor ? <Badge variant="secondary">{entry.actor.role}</Badge> : null}
        </div>

        <div className="grid gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Acteur
            </span>
            <span>{getAuditUserLabel(entry.actor)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cible
            </span>
            <span>{getAuditUserLabel(entry.targetUser)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Groupe
            </span>
            <span title={entry.group?.name}>
              {entry.group ? `${truncateGroupName(entry.group.name)} (#${entry.group.id})` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Payload
            </span>
            <pre className="max-h-44 overflow-y-auto rounded-lg bg-muted/40 p-3 text-[11px] whitespace-pre-wrap break-words">
              {formatAuditPayload(entry.payload)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminAuditLogsSection({
  auditLogs,
  isLoading,
  onRefresh,
}: {
  auditLogs: AdminAuditLog[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const actionOptions = useMemo(
    () =>
      Array.from(new Set(auditLogs.map((entry) => entry.action))).sort((left, right) =>
        left.localeCompare(right)
      ),
    [auditLogs]
  );

  const filteredLogs = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return auditLogs.filter((entry) => {
      if (action !== "all" && entry.action !== action) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        entry.action,
        getAuditUserLabel(entry.actor),
        entry.actor?.email ?? "",
        entry.actor?.role ?? "",
        getAuditUserLabel(entry.targetUser),
        entry.targetUser?.email ?? "",
        entry.targetUser?.role ?? "",
        entry.group?.name ?? "",
        String(entry.group?.id ?? ""),
        formatAuditPayload(entry.payload),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [action, auditLogs, deferredSearch]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleLogs = useMemo(
    () => filteredLogs.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredLogs, safePage]
  );
  const isInitialLoading = isLoading && auditLogs.length === 0;
  const hasLogs = filteredLogs.length > 0;

  return (
    <Card id="audit" className="min-w-0 overflow-hidden border-border/60 py-0">
      <CardHeader className="gap-4 border-b border-border/60 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <History data-icon="inline-start" className="text-primary" />
              Audit logs
            </CardTitle>
            <CardDescription>
              Historique récent des actions sensibles tracées en base: rôles, groupes, API keys,
              conformité et opérations coach/admin.
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
            <FieldLabel htmlFor="admin-audit-search">Recherche</FieldLabel>
            <Input
              id="admin-audit-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Action, utilisateur, groupe, payload..."
            />
          </Field>
          <Field>
            <FieldLabel>Action</FieldLabel>
            <Select
              value={action}
              onValueChange={(value) => {
                setAction(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  {actionOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatAuditAction(option)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </CardHeader>

      <CardContent className="px-4 py-4 sm:px-6">
        {isInitialLoading ? (
          <div className="rounded-xl border border-border/60 px-6 py-8 text-sm text-muted-foreground">
            Chargement des audit logs...
          </div>
        ) : !hasLogs ? (
          <Empty className="min-h-52 rounded-xl border border-dashed border-border/60">
            <EmptyHeader>
              <EmptyTitle>Aucun audit log à afficher.</EmptyTitle>
              <EmptyDescription>
                Ajuste la recherche ou l’action sélectionnée pour élargir les résultats.
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
                {filteredLogs.length} audit log{filteredLogs.length > 1 ? "s" : ""} affiché
                {filteredLogs.length > 1 ? "s" : ""}
              </p>
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <RotateCw className="animate-spin" />
                  Mise à jour en cours...
                </span>
              ) : null}
            </div>

            <div className="grid gap-3 px-3 py-3 lg:hidden">
              {visibleLogs.map((entry) => (
                <AuditLogMobileCard key={entry.id} entry={entry} />
              ))}
            </div>

            <div className="hidden min-w-0 px-2 py-2 lg:block lg:px-3">
              <Table className="min-w-[1180px]">
                <TableCaption className="sr-only">
                  Historique des audit logs d’administration.
                </TableCaption>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Quand</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Acteur</TableHead>
                    <TableHead>Cible</TableHead>
                    <TableHead>Groupe</TableHead>
                    <TableHead>Payload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleLogs.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell
                        className="align-top text-sm text-muted-foreground"
                        title={formatCoachDate(entry.createdAt, true)}
                      >
                        {formatAuditDateTime(entry.createdAt)}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex min-w-44 flex-col gap-2">
                          <span className="font-medium capitalize">
                            {formatAuditAction(entry.action)}
                          </span>
                          <Badge variant="outline" className="w-fit">
                            #{entry.id}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-normal">
                        <div className="flex min-w-44 flex-col gap-1">
                          <span className="font-medium">{getAuditUserLabel(entry.actor)}</span>
                          {entry.actor ? (
                            <>
                              <span className="text-xs text-muted-foreground">{entry.actor.email}</span>
                              <Badge variant="secondary" className="w-fit capitalize">
                                {entry.actor.role}
                              </Badge>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-normal">
                        <div className="flex min-w-44 flex-col gap-1">
                          <span className="font-medium">{getAuditUserLabel(entry.targetUser)}</span>
                          {entry.targetUser ? (
                            <>
                              <span className="text-xs text-muted-foreground">
                                {entry.targetUser.email}
                              </span>
                              <Badge variant="outline" className="w-fit capitalize">
                                {entry.targetUser.role}
                              </Badge>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-normal">
                        {entry.group ? (
                          <div className="flex min-w-40 flex-col gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="max-w-[14ch] truncate font-medium">
                                  {truncateGroupName(entry.group.name)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={8}>
                                {entry.group.name}
                              </TooltipContent>
                            </Tooltip>
                            <span className="text-xs text-muted-foreground">#{entry.group.id}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md align-top whitespace-normal">
                        <pre className="max-h-36 overflow-y-auto rounded-lg bg-muted/40 p-3 text-[11px] whitespace-pre-wrap break-words text-muted-foreground">
                          {formatAuditPayload(entry.payload)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {hasLogs ? (
          <div className="mt-4">
            <LocalPagination
              currentPage={safePage}
              pageCount={pageCount}
              totalCount={filteredLogs.length}
              pageSize={pageSize}
              itemLabel="audit logs"
              compact
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
