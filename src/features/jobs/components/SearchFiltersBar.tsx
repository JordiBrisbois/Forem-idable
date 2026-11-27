"use client";

import { useMemo, useState } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOfferFacets, type OfferFacetValue } from "@/features/jobs/hooks/useOfferFacets";
import { formatFreshness, useMirrorStatus } from "@/features/jobs/hooks/useMirrorStatus";
import type { SearchFilters, SearchSort } from "@/types/search";

interface SearchFiltersBarProps {
  sort: SearchSort;
  onSortChange: (sort: SearchSort) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  hasKeywords: boolean;
  disabled?: boolean;
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function FacetGroup({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string;
  values: OfferFacetValue[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (values.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
        {values.map((facet) => {
          const id = `${title}-${facet.value}`;
          const checked = selected.includes(facet.value);
          return (
            <div key={id} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={() => onToggle(facet.value)}
              />
              <Label htmlFor={id} className="flex-1 cursor-pointer text-sm font-normal">
                {facet.value}
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">{facet.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Result refinements: ordering, plus the mirror's own regimes, sectors and
 * languages. Every option comes with its count, so a filter never leads to an
 * empty page by accident.
 */
export function SearchFiltersBar({
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  hasKeywords,
  disabled = false,
}: SearchFiltersBarProps) {
  const { facets, isLoading } = useOfferFacets();
  const mirror = useMirrorStatus();
  const [open, setOpen] = useState(false);

  const activeCount =
    filters.regimes.length + filters.sectors.length + filters.languages.length;

  const sortOptions = useMemo(
    () => [
      { value: "date" as const, label: "Plus récentes" },
      { value: "relevance" as const, label: "Pertinence" },
    ],
    []
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mirror ? (
        <p className="mr-auto text-xs text-muted-foreground" title={mirror.lastSyncAt ?? undefined}>
          Données {formatFreshness(mirror.ageMinutes)}
          {mirror.newOffers && mirror.newOffers > 0
            ? ` · ${mirror.newOffers} nouvelle${mirror.newOffers > 1 ? "s" : ""} offre${mirror.newOffers > 1 ? "s" : ""} depuis votre dernière visite`
            : ""}
        </p>
      ) : null}
      <Select
        value={sort}
        onValueChange={(value) => onSortChange(value as SearchSort)}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 w-[168px] rounded-full" aria-label="Trier les résultats">
          <SelectValue placeholder="Trier par" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.value === "relevance" && !hasKeywords}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 rounded-full" disabled={disabled}>
            <Filter data-icon="inline-start" />
            Filtres
            {activeCount > 0 ? (
              <Badge variant="secondary" className="ml-1">
                {activeCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">Affiner les résultats</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() =>
                  onFiltersChange({ regimes: [], sectors: [], languages: [] })
                }
                disabled={activeCount === 0}
              >
                <RotateCcw data-icon="inline-start" />
                Réinitialiser
              </Button>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement des filtres…</p>
            ) : (
              <>
                <FacetGroup
                  title="Régime"
                  values={facets.regimes}
                  selected={filters.regimes}
                  onToggle={(value) =>
                    onFiltersChange({ ...filters, regimes: toggleValue(filters.regimes, value) })
                  }
                />
                <Separator />
                <FacetGroup
                  title="Secteur"
                  values={facets.sectors}
                  selected={filters.sectors}
                  onToggle={(value) =>
                    onFiltersChange({ ...filters, sectors: toggleValue(filters.sectors, value) })
                  }
                />
                <Separator />
                <FacetGroup
                  title="Langue"
                  values={facets.languages}
                  selected={filters.languages}
                  onToggle={(value) =>
                    onFiltersChange({ ...filters, languages: toggleValue(filters.languages, value) })
                  }
                />
                {activeCount === 0 && facets.regimes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun filtre disponible pour ces offres.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
