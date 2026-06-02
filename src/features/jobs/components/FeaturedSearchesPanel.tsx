"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeaturedSearch } from "@/types/featuredSearch";

interface FeaturedSearchesPanelProps {
  items: FeaturedSearch[];
  onRunSearch: (item: FeaturedSearch) => void;
}

export function FeaturedSearchesPanel({
  items,
  onRunSearch,
}: FeaturedSearchesPanelProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-linear-to-r from-amber-50/50 via-background to-background p-4 shadow-sm transition-colors hover:border-primary/25 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold leading-5 text-foreground">{item.title}</p>
              {item.message ? (
                <p className="text-sm leading-5 text-muted-foreground">{item.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <Button
              type="button"
              onClick={() => onRunSearch(item)}
              className="w-full rounded-full px-4 shadow-sm sm:w-auto"
            >
              {item.ctaLabel}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
