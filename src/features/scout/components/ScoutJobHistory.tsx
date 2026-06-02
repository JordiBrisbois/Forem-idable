"use client";

import { History, Trash2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoutJob } from "../scoutSchemas";

interface ScoutJobHistoryProps {
  jobs: ScoutJob[];
  activeJobId?: number;
  onSelect: (job: ScoutJob) => void;
  onDelete: (jobId: number) => void;
  onOpenHistory: () => void;
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(date: string | null) {
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours} h`;
  if (diffDays < 7) return `il y a ${diffDays} j`;
  return formatDate(date);
}

function statusLabel(status: ScoutJob["status"]) {
  switch (status) {
    case "queued": return { text: "En file", variant: "secondary" as const };
    case "pending": return { text: "En attente", variant: "warning" as const };
    case "running": return { text: "En cours", variant: "info" as const };
    case "completed": return { text: "Terminé", variant: "success" as const };
    case "failed": return { text: "Échec", variant: "error" as const };
  }
}

export function ScoutJobHistory({ jobs, activeJobId, onSelect, onDelete, onOpenHistory }: ScoutJobHistoryProps) {
  if (jobs.length === 0) return null;

  const recent = jobs.slice(0, 4);
  const remaining = Math.max(0, jobs.length - 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Historique</CardTitle>
        {remaining > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={onOpenHistory}
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Voir tout ({remaining})</span>
            <span className="sm:hidden">Voir tout</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.map((job) => {
          const status = statusLabel(job.status);
          const isActive = job.id === activeJobId;
          return (
            <button
              key={job.id}
              onClick={() => onSelect(job)}
              className={`group w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{job.query}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{job.radius >= 1000 ? `${(job.radius / 1000).toFixed(1)} km` : `${job.radius} m`}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(job.createdAt)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={status.variant} className="rounded px-1.5 py-0.5 text-[10px]">
                    {status.text}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              {job.status === "completed" && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {job.resultCount} résultat{job.resultCount !== 1 ? "s" : ""}
                </div>
              )}
            </button>
          );
        })}
        {remaining === 0 && jobs.length > 5 && (
          <Button type="button" variant="ghost" size="sm" className="w-full text-xs" onClick={onOpenHistory}>
            <History className="mr-1.5 h-3.5 w-3.5" />
            Voir tout l&apos;historique
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
