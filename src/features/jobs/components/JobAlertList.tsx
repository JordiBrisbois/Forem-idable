"use client";

import { BellOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPublicationDateCompact } from "@/components/jobs/jobTableUtils";
import type { JobAlertSummary } from "@/features/jobs/hooks/useJobAlerts";

function criteriaSummary(alert: JobAlertSummary): string {
  const parts: string[] = [];

  if (alert.keywords.length > 0) parts.push(alert.keywords.join(", "));
  if (alert.contractTypes.length > 0) parts.push(alert.contractTypes.join(", "));
  if (alert.regimes.length > 0) parts.push(alert.regimes.join(", "));
  if (alert.sectors.length > 0) parts.push(alert.sectors.join(", "));
  if (alert.languages.length > 0) parts.push(alert.languages.join(", "));

  return parts.length > 0 ? parts.join(" · ") : "Toutes les offres";
}

export function JobAlertList({
  alerts,
  isLoading,
  deletingId,
  onDelete,
}: {
  alerts: JobAlertSummary[] | null;
  isLoading: boolean;
  deletingId: number | null;
  onDelete: (alertId: number) => void;
}) {
  if (isLoading && alerts === null) {
    return <p className="text-sm text-muted-foreground">Chargement de vos alertes…</p>;
  }

  if (!alerts || alerts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune alerte pour l&apos;instant. Enregistrez cette recherche pour recevoir ses
        nouveautés par email.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {alerts.map((alert) => (
        <li key={alert.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              {alert.isActive ? (
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              ) : (
                <BellOff className="size-3.5 text-muted-foreground" aria-hidden />
              )}
              <p className="truncate text-sm font-medium text-foreground">{alert.name}</p>
              <Badge variant="secondary">
                {alert.isActive ? "Active" : "Désinscrite"}
              </Badge>
              <Badge variant="outline">1 email/jour</Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">{criteriaSummary(alert)}</p>
            <p className="text-xs text-muted-foreground">
              {alert.lastSentAt
                ? `Dernier envoi le ${formatPublicationDateCompact(alert.lastSentAt)}`
                : "En attente de la première offre"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2"
            aria-label={`Supprimer l'alerte ${alert.name}`}
            disabled={deletingId === alert.id}
            onClick={() => onDelete(alert.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
