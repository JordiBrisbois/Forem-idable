"use client";

import { BriefcaseBusiness, Clock3, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface ApplicationsEmptyStateProps {
  hasApplications: boolean;
  onCreateManual: () => void;
  onResetFilters: () => void;
}

export function ApplicationsEmptyState({
  hasApplications,
  onCreateManual,
  onResetFilters,
}: ApplicationsEmptyStateProps) {
  return (
    <Empty className="mt-8 min-h-96 w-full bg-muted/10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BriefcaseBusiness />
        </EmptyMedia>
        <EmptyTitle>
          {hasApplications
            ? "Aucune candidature ne correspond aux filtres actuels."
            : "Aucune candidature suivie pour le moment."}
        </EmptyTitle>
        <EmptyDescription>
          {hasApplications
            ? "Ajustez la recherche ou les filtres pour retrouver vos candidatures."
            : "Utilisez le bouton de candidature depuis les résultats ou encodez une candidature faite ailleurs."}
        </EmptyDescription>
      </EmptyHeader>

      {hasApplications ? (
        <Button type="button" variant="outline" onClick={onResetFilters}>
          Réinitialiser les filtres
        </Button>
      ) : (
        <EmptyContent>
          <Button type="button" onClick={onCreateManual}>
            <Plus data-icon="inline-start" />
            Ajouter une candidature manuelle
          </Button>
        </EmptyContent>
      )}

      <Badge variant="warning" className="gap-2 rounded-full px-3 py-1 text-xs">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        Les relances sont mises en avant 7 jours après l&apos;envoi.
      </Badge>
    </Empty>
  );
}
