"use client";

import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchQuery } from "@/types/search";
import { SearchHistoryEntry } from "@/features/jobs/types/searchHistory";
import { cn } from "@/lib/utils";

interface SearchHistoryPanelProps {
  history: SearchHistoryEntry[];
  onReplay: (query: SearchQuery) => void;
  onClear: () => void;
  maxVisible?: number;
}

export function SearchHistoryPanel({
  history,
  onReplay,
  onClear,
  maxVisible = history.length,
}: SearchHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  const visibleHistory = history.slice(0, maxVisible);
  const hiddenHistory = history.slice(maxVisible);
  const hasOverflow = hiddenHistory.length > 0;

  return (
    <Card className="border-border/60 bg-linear-to-br from-card to-muted/15">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <History data-icon="inline-start" />
              Historique récent
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Rejouez rapidement les dernières recherches utiles sans encombrer l’écran.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasOverflow ? (
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {isOpen ? "Réduire" : `Voir ${hiddenHistory.length} de plus`}
                  <ChevronDown
                    data-icon="inline-end"
                    className={cn(isOpen ? "rotate-180" : undefined)}
                  />
                </Button>
              </CollapsibleTrigger>
            ) : null}
            <Button variant="ghost" size="sm" onClick={onClear}>
              Vider
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {visibleHistory.map((entry) => (
              <HistoryChip key={entry.id} entry={entry} onReplay={onReplay} />
            ))}
          </div>

          {hasOverflow ? (
            <CollapsibleContent className="pt-1">
              <div className="flex flex-wrap gap-2">
                {hiddenHistory.map((entry) => (
                  <HistoryChip key={entry.id} entry={entry} onReplay={onReplay} />
                ))}
              </div>
            </CollapsibleContent>
          ) : null}
        </CardContent>
      </Collapsible>
    </Card>
  );
}

function HistoryChip({
  entry,
  onReplay,
}: {
  entry: SearchHistoryEntry;
  onReplay: (query: SearchQuery) => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="max-w-full justify-start rounded-full"
      onClick={() => onReplay(entry.state)}
      title={new Date(entry.createdAt).toLocaleString("fr-BE")}
    >
      <span className="max-w-[320px] truncate">
        {entry.state.keywords.slice(0, 3).join(
          ` ${entry.state.booleanMode === "AND" ? "ET" : "OU"} `
        ) || "Sans mot-clé"}
        {entry.state.locations.length > 0 ? ` • ${entry.state.locations.length} lieu(x)` : ""}
        {" • "}
        {new Date(entry.createdAt).toLocaleDateString("fr-BE")}{" "}
        {new Date(entry.createdAt).toLocaleTimeString("fr-BE", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </Button>
  );
}
