"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellOff, MailX, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useJobAlerts } from "@/features/jobs/hooks/useJobAlerts";

/**
 * Alerts management on the account page: list, per-alert pause, delete one, and
 * "stop everything".
 *
 * The same data as the dialog on the results page, but here it is the canonical
 * place a user looks for when they want out — and the GDPR footer of every email
 * links to `#alertes`.
 */
export function JobAlertsSection({ enabled }: { enabled: boolean }) {
  const alerts = useJobAlerts({ enabled });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const toggleAlert = async (alertId: number, isActive: boolean) => {
    setBusyId(alertId);
    const updated = await alerts.setActive(alertId, isActive);
    setBusyId(null);
    toast[updated ? "success" : "error"](
      updated
        ? isActive
          ? "Les emails reprennent pour cette alerte."
          : "Cette alerte ne vous enverra plus d'emails."
        : "Impossible de modifier cette alerte."
    );
  };

  const deleteOne = async (alertId: number) => {
    const deleted = await alerts.remove(alertId);
    toast[deleted ? "success" : "error"](
      deleted ? "Alerte supprimée." : "Impossible de supprimer cette alerte."
    );
  };

  const deleteAll = async () => {
    setIsDeletingAll(true);
    const deleted = await alerts.removeAll();
    setIsDeletingAll(false);
    toast[deleted ? "success" : "error"](
      deleted ? "Toutes vos alertes ont été supprimées." : "Impossible de supprimer vos alertes."
    );
  };

  const count = alerts.count;

  return (
    <Card className="overflow-hidden shadow-sm" id="alertes">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell data-icon="inline-start" />
              Alertes email
              {count > 0 ? <Badge variant="secondary">{count}</Badge> : null}
            </CardTitle>
            <CardDescription>
              Un seul email par jour, et seulement s&apos;il y a de nouvelles offres. Chaque email
              contient un lien de désinscription.
            </CardDescription>
          </div>

          {count > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0" disabled={isDeletingAll}>
                  <MailX data-icon="inline-start" />
                  Me désinscrire de tout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer toutes vos alertes ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Vous ne recevrez plus d&apos;email pour vos recherches enregistrées. Les
                    alertes et leurs critères sont définitivement supprimés ; vos recherches
                    restent possibles à tout moment depuis la page d&apos;accueil.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void deleteAll()}>
                    Supprimer mes alertes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!enabled ? null : alerts.alerts === null ? (
          <p className="text-sm text-muted-foreground">Chargement de vos alertes…</p>
        ) : count === 0 ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border/70 p-4">
            <p className="text-sm text-muted-foreground">
              Vous n&apos;avez aucune alerte. Enregistrez une recherche depuis les résultats pour
              recevoir ses nouveautés par email.
            </p>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/">
                <Search data-icon="inline-start" />
                Chercher des offres
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-border/60">
              {alerts.alerts?.map((alert) => (
                <li
                  key={alert.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{alert.name}</p>
                      {alert.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">En pause</Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {[...alert.keywords, ...alert.contractTypes, ...alert.regimes]
                        .filter(Boolean)
                        .join(" · ") || "Toutes les offres"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.lastSentAt
                        ? "Dernier envoi effectué"
                        : "En attente de la première offre"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={alert.isActive}
                        disabled={busyId === alert.id}
                        onCheckedChange={(checked) => void toggleAlert(alert.id, checked === true)}
                        aria-label={`Recevoir les emails de l'alerte ${alert.name}`}
                      />
                      {alert.isActive ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
                      Recevoir
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-destructive hover:text-destructive"
                      aria-label={`Supprimer l'alerte ${alert.name}`}
                      onClick={() => void deleteOne(alert.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <Separator />
            <p className="text-xs text-muted-foreground">
              Supprimer une alerte supprime ses critères et son adresse de destination. La
              désinscription depuis un email a le même effet.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
