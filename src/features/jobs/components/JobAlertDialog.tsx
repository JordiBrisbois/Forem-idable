"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { SearchFilters, SearchQuery } from "@/types/search";

export interface JobAlertSummary {
  id: number;
  name: string;
  keywords: string[];
  isActive: boolean;
  lastSentAt: string | null;
}

interface JobAlertDialogProps {
  query: SearchQuery | null;
  filters: SearchFilters;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

/**
 * Creates and manages the "email me new offers" alert for the current search.
 *
 * The consent checkbox is not decoration: the API rejects a payload without
 * `consent: true`, and the row stores the timestamp.
 */
export function JobAlertDialog({
  query,
  filters,
  isAuthenticated,
  onRequireAuth,
}: JobAlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alerts, setAlerts] = useState<JobAlertSummary[] | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAlerts = async () => {
    try {
      const response = await fetch("/api/alerts", { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const payload = (await response.json()) as { alerts: JobAlertSummary[] };
      setAlerts(payload.alerts);
    } catch {
      // Listing is secondary: the dialog still allows creating an alert.
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && isAuthenticated) void loadAlerts();
  };

  const createAlert = async () => {
    if (!query) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          keywords: query.keywords,
          locations: query.locations,
          booleanMode: query.booleanMode,
          goal: query.goal,
          contractTypes: query.contractTypes ?? [],
          regimes: filters.regimes,
          sectors: filters.sectors,
          languages: filters.languages,
          consent: true,
        }),
      });

      if (response.status === 409) {
        toast.error("Vous avez déjà 5 alertes. Supprimez-en une pour en créer une autre.");
        return;
      }
      if (!response.ok) {
        toast.error("Impossible de créer l'alerte pour le moment.");
        return;
      }

      toast.success("Alerte créée. Vous recevrez un email quand de nouvelles offres sortiront.");
      setName("");
      setConsent(false);
      await loadAlerts();
    } catch {
      toast.error("Impossible de créer l'alerte pour le moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAlert = async (alertId: number) => {
    setDeletingId(alertId);
    try {
      const response = await fetch(`/api/alerts/${alertId}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Impossible de supprimer cette alerte.");
        return;
      }
      toast.success("Alerte supprimée.");
      await loadAlerts();
    } finally {
      setDeletingId(null);
    }
  };

  if (!query) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-full">
          <Bell data-icon="inline-start" />
          Créer une alerte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recevoir les nouvelles offres par email</DialogTitle>
          <DialogDescription>
            Un email par jour, uniquement lorsqu&apos;il y a de nouvelles offres pour cette
            recherche. Vous pouvez vous désinscrire en un clic depuis chaque email.
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Créez un compte pour enregistrer cette recherche et recevoir ses nouveautés.
            </p>
            <Button onClick={onRequireAuth}>Se connecter</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="alert-name">Nom de l&apos;alerte (optionnel)</Label>
              <Input
                id="alert-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex. Développeur à Namur"
                maxLength={120}
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="alert-consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
              />
              <Label htmlFor="alert-consent" className="text-sm font-normal leading-snug">
                J&apos;accepte de recevoir un email quotidien pour cette recherche. Je peux me
                désinscrire à tout moment, et supprimer l&apos;alerte supprime mes données.
              </Label>
            </div>

            <DialogFooter className="sm:justify-start">
              <Button onClick={() => void createAlert()} disabled={!consent || isSaving}>
                {isSaving ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Bell data-icon="inline-start" />
                )}
                Créer l&apos;alerte
              </Button>
            </DialogFooter>

            {alerts && alerts.length > 0 ? (
              <div className="flex flex-col gap-2">
                <Separator />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Vos alertes
                </p>
                <ul className="flex flex-col gap-2">
                  {alerts.map((alert) => (
                    <li key={alert.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        {alert.isActive ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                        {alert.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        aria-label={`Supprimer l'alerte ${alert.name}`}
                        disabled={deletingId === alert.id}
                        onClick={() => void deleteAlert(alert.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
