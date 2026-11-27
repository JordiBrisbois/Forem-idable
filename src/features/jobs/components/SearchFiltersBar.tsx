"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Filter, LocateFixed, RotateCcw } from "lucide-react";
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
import type { LocationEntry } from "@/services/location/locationCache";
import type { NearPoint, SearchFilters, SearchSort } from "@/types/search";

interface SearchFiltersBarProps {
  sort: SearchSort;
  onSortChange: (sort: SearchSort) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  hasKeywords: boolean;
  disabled?: boolean;
  near?: NearPoint;
  onNearChange?: (near: NearPoint | undefined) => void;
  /** Places already selected in the search form, used to centre "around me". */
  locations?: LocationEntry[];
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

async function fetchCentroid(location: LocationEntry): Promise<NearPoint | null> {
  const params = new URLSearchParams({ name: location.name });
  if (location.postalCode) params.set("postalCode", location.postalCode);

  try {
    const response = await fetch(`/api/offers/centroid?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as { lat: number; lon: number };
    return { lat: payload.lat, lon: payload.lon, radiusKm: 25 };
  } catch {
    return null;
  }
}

function browserPosition(): Promise<NearPoint | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          radiusKm: 25,
        }),
      () => resolve(null),
      { timeout: 8000 }
    );
  });
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
  near,
  onNearChange,
  locations = [],
}: SearchFiltersBarProps) {
  const { facets, isLoading } = useOfferFacets();
  const mirror = useMirrorStatus();
  const [open, setOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const activeCount =
    filters.regimes.length + filters.sectors.length + filters.languages.length;

  const selectedPlace = locations[0];
  const placeLabel = selectedPlace?.name;

  const sortOptions = useMemo(
    () => [
      { value: "date" as const, label: "Plus récentes" },
      { value: "relevance" as const, label: "Pertinence" },
    ],
    []
  );

  const locate = async () => {
    if (near) {
      onNearChange?.(undefined);
      return;
    }

    setIsLocating(true);
    try {
      // The visitor already told us where they want to work: centre on that
      // place rather than on their device, which may be somewhere else.
      if (selectedPlace) {
        const fromPlace = await fetchCentroid(selectedPlace);
        if (fromPlace) {
          onNearChange?.(fromPlace);
          return;
        }
      }

      const fromDevice = await browserPosition();
      if (fromDevice) {
        onNearChange?.(fromDevice);
        return;
      }

      toast.error(
        selectedPlace
          ? "Position de ce lieu indisponible. Autorisiez la géolocalisation ou choisissez un autre lieu."
          : "Position indisponible. Autorisez la géolocalisation pour trier par distance."
      );
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
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
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={near ? "secondary" : "outline"}
          size="sm"
          className="h-9 max-w-[220px] rounded-full"
          onClick={() => void locate()}
          disabled={disabled || !onNearChange || isLocating}
          aria-pressed={Boolean(near)}
          title={
            selectedPlace
              ? `Chercher autour de ${selectedPlace.name}`
              : "Chercher autour de ma position"
          }
        >
          <LocateFixed data-icon="inline-start" />
          <span className="truncate">
            {placeLabel ? `Autour de ${placeLabel}` : "Autour de moi"}
          </span>
        </Button>

        {near ? (
          <Select
            value={String(near.radiusKm)}
            onValueChange={(value) => onNearChange?.({ ...near, radiusKm: Number(value) })}
            disabled={disabled}
          >
            <SelectTrigger
              className="h-9 w-[110px] rounded-full"
              aria-label={placeLabel ? `Rayon autour de ${placeLabel}` : "Rayon de recherche"}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((radius) => (
                <SelectItem key={radius} value={String(radius)}>
                  {radius} km
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

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
          <PopoverContent
            side="bottom"
            align="end"
            sideOffset={8}
            collisionPadding={16}
            className="max-h-[var(--radix-popover-content-available-height)] w-80 overflow-y-auto overscroll-contain"
          >
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
                      onFiltersChange({
                        ...filters,
                        languages: toggleValue(filters.languages, value),
                      })
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

      {sort === "relevance" && !hasKeywords ? (
        <p className="text-xs text-muted-foreground">
          La pertinence classe les offres selon vos mots-clés : ajoutez-en un pour en profiter,
          sinon les plus récentes restent en tête.
        </p>
      ) : null}

      {near && placeLabel ? (
        <p className="text-xs text-muted-foreground">
          Distance calculée depuis {placeLabel}, dans un rayon de {near.radiusKm} km.
        </p>
      ) : null}
    </div>
  );
}
