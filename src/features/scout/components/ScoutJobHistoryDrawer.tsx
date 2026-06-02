"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { History, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalPagination } from "@/components/ui/local-pagination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ScoutJob } from "../scoutSchemas";

type StatusFilter = "all" | "queued" | "running" | "completed" | "failed";

interface ScoutJobHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: ScoutJob[];
  activeJobId?: number;
  onSelect: (job: ScoutJob) => void;
  onDelete: (jobId: number) => void;
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: ScoutJob["status"]) {
  switch (status) {
    case "queued": return { text: "En file", variant: "secondary" as const };
    case "pending": return { text: "En attente", variant: "warning" as const };
    case "running": return { text: "En cours", variant: "info" as const };
    case "completed": return { text: "Terminé", variant: "success" as const };
    case "failed": return { text: "Échec", variant: "error" as const };
  }
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "queued", label: "En file" },
  { value: "running", label: "En cours" },
  { value: "completed", label: "Terminés" },
  { value: "failed", label: "Échecs" },
];

export function ScoutJobHistoryDrawer({
  open,
  onOpenChange,
  jobs,
  activeJobId,
  onSelect,
  onDelete,
}: ScoutJobHistoryDrawerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    let list = jobs;
    if (statusFilter !== "all") {
      list = list.filter((j) => j.status === statusFilter);
    }
    const q = deferredSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((j) => j.query.toLowerCase().includes(q));
    }
    return list;
  }, [jobs, statusFilter, deferredSearch]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-full flex-col gap-0 overflow-hidden sm:max-w-lg md:max-w-xl">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex min-w-0 items-center gap-2 pr-8 text-lg">
              <History className="h-5 w-5 text-primary" />
              <span className="min-w-0 truncate">Historique des recherches</span>
              <span className="text-sm font-normal text-muted-foreground">({jobs.length})</span>
            </SheetTitle>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrer par ville..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>

            <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:h-8 sm:grid-cols-5">
                {STATUS_OPTIONS.map((opt) => (
                  <TabsTrigger key={opt.value} value={opt.value} className="h-8 text-xs">
                    {opt.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {visible.length === 0 ? (
            <div className="mx-4 flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Aucune recherche ne correspond aux filtres.
            </div>
          ) : (
            <>
              <div className="space-y-2 px-4 md:hidden">
                {visible.map((job) => {
                  const status = statusBadge(job.status);
                  const isActive = job.id === activeJobId;
                  return (
                    <div
                      key={job.id}
                      className={cn(
                        "flex min-w-0 items-start gap-2 rounded-lg border bg-card p-3 shadow-sm transition-colors",
                        isActive ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => {
                          onSelect(job);
                          onOpenChange(false);
                        }}
                      >
                        <p className="truncate text-sm font-medium" title={job.query}>
                          {job.query}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {job.radius >= 1000 ? `${(job.radius / 1000).toFixed(1)} km` : `${job.radius} m`} · {formatDate(job.createdAt)}
                        </p>
                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                          <Badge variant={status.variant} className="rounded px-1.5 py-0.5 text-[10px]">
                            {status.text}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {job.status === "completed" ? `${job.resultCount} résultats` : "—"}
                          </span>
                        </div>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => onDelete(job.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="hidden px-4 md:block">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Ville</TableHead>
                        <TableHead className="w-[18%]">Statut</TableHead>
                        <TableHead className="w-[18%]">Résultats</TableHead>
                        <TableHead className="w-[24%]">Date</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((job) => {
                        const status = statusBadge(job.status);
                        const isActive = job.id === activeJobId;
                        return (
                          <TableRow
                            key={job.id}
                            className={`cursor-pointer ${isActive ? "bg-primary/5" : ""}`}
                            onClick={() => {
                              onSelect(job);
                              onOpenChange(false);
                            }}
                          >
                            <TableCell className="truncate font-medium" title={job.query}>
                              {job.query.length > 25 ? `${job.query.slice(0, 25)}…` : job.query}
                              <div className="text-xs text-muted-foreground">
                                {job.radius >= 1000 ? `${(job.radius / 1000).toFixed(1)} km` : `${job.radius} m`}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="rounded px-1.5 py-0.5 text-[10px]">
                                {status.text}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {job.status === "completed" ? `${job.resultCount}` : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(job.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(job.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>

        {filtered.length > pageSize && (
          <div className="border-t px-4 pb-4 pt-4">
            <LocalPagination
              currentPage={safePage}
              pageCount={pageCount}
              totalCount={filtered.length}
              pageSize={pageSize}
              itemLabel="recherches"
              compact
              onPageChange={setPage}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
