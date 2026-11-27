"use client";

import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { JobAlertList } from "@/features/jobs/components/JobAlertList";
import { useJobAlerts } from "@/features/jobs/hooks/useJobAlerts";
import type { SearchFilters, SearchQuery } from "@/types/search";

interface JobAlertDialogProps {
  query: SearchQuery | null;
  filters: SearchFilters;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

function searchSummary(query: SearchQuery | null, filters: SearchFilters): string {
  if (!query) return "Toutes les offres";

  const parts = [
    query.keywords.length > 0 ? query.keywords.join(", ") : "tous les mots-clés",
    query.locations.length > 0
      ? query.locations.map((location) => location.name).join(", ")
      : "toute la Belgique",
  ];

  const filterCount =
    filters.regimes.length + filters.sectors.length + filters.languages.length;
  if (filterCount > 0) {
    parts.push(`${filterCount} filtre${filterCount > 1 ? "s" : ""} actif${filterCount > 1 ? "s" : ""}`);
  }

  return parts.join(" · ");
}

/**
 * One entry point for alerts: the list of saved searches *and* the form that
 * creates a new one for the current search. The trigger carries the count, so a
 * user who already has alerts can see them without opening the dialog.
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
  const alertsState = useJobAlerts({ enabled: isAuthenticated });

  const createAlert = async () => {
    if (!query) return;

    setIsSaving(true);
    try {
      const result = await alertsState.create({ query, filters, name });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Alerte créée. Vous recevrez un email quand de nouvelles offres sortiront.");
      setName("");
      setConsent(false);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAlert = async (alertId: number) => {
    const deleted = await alertsState.remove(alertId);
    if (deleted) {
      toast.success("Alerte supprimée.");
    } else {
      toast.error("Impossible de supprimer cette alerte.");
    }
  };

  if (!query) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={alertsState.count > 0 ? "secondary" : "outline"}
          size="sm"
          className="h-9 rounded-full"
          aria-label="Créer ou gérer mes alertes"
        >
          <Bell data-icon="inline-start" />
          Alertes
          {alertsState.count > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {alertsState.count}
            </Badge>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vos alertes de recherche</DialogTitle>
          <DialogDescription>
            Un email par jour, uniquement lorsqu&apos;il y a de nouvelles offres. Vous pouvez vous
            désinscrire en un clic depuis chaque email.
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
          <div className="flex flex-col gap-5">
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Alertes enregistrées
                </h3>
                {alertsState.count > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {alertsState.count} / 5
                  </span>
                ) : null}
              </div>
              <JobAlertList
                alerts={alertsState.alerts}
                isLoading={alertsState.isLoading}
                deletingId={alertsState.deletingId}
                onDelete={(alertId) => void deleteAlert(alertId)}
              />
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Créer une alerte pour cette recherche
                </h3>
                <p className="text-xs text-muted-foreground">
                  {searchSummary(query, filters)}
                </p>
              </div>

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

              <div>
                <Button
                  onClick={() => void createAlert()}
                  disabled={!consent || isSaving || alertsState.count >= 5}
                >
                  {isSaving ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Bell data-icon="inline-start" />
                  )}
                  Créer l&apos;alerte
                </Button>
                {alertsState.count >= 5 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Vous avez atteint 5 alertes. Supprimez-en une pour en créer une autre.
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
