"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeaturedSearch } from "@/types/featuredSearch";

interface SearchHintsProps {
  selectedLocationsLabel: string | null;
  featuredSearches: FeaturedSearch[];
  onRunFeaturedSearch?: (item: FeaturedSearch) => void;
}

export function SearchHints({
  selectedLocationsLabel,
  featuredSearches,
  onRunFeaturedSearch,
}: SearchHintsProps) {
  const visibleFeaturedSearches = featuredSearches.slice(0, 3);
  const primaryFeaturedSearch = visibleFeaturedSearches[0];
  const secondaryFeaturedSearches = visibleFeaturedSearches.slice(1);

  const hasContent = selectedLocationsLabel || primaryFeaturedSearch;
  if (!hasContent) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-muted/15 px-4 py-3 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        {selectedLocationsLabel ? (
          <Badge variant="outline" className="rounded-full border-border/70">
            Filtre lieu: {selectedLocationsLabel}
          </Badge>
        ) : null}
      </div>

      {primaryFeaturedSearch && onRunFeaturedSearch ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-background/70 p-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </div>
            <p className="text-sm font-semibold text-foreground">{primaryFeaturedSearch.title}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {primaryFeaturedSearch.message ? (
              <p className="text-xs leading-5 text-muted-foreground">
                {primaryFeaturedSearch.message}
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              className="rounded-full sm:self-start"
              onClick={() => onRunFeaturedSearch(primaryFeaturedSearch)}
            >
              {primaryFeaturedSearch.ctaLabel}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>

          {secondaryFeaturedSearches.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {secondaryFeaturedSearches.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="max-w-full rounded-full"
                  onClick={() => onRunFeaturedSearch(item)}
                  title={item.message || item.title}
                >
                  <span className="max-w-[220px] truncate">{item.title}</span>
                  <ArrowRight data-icon="inline-end" />
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
