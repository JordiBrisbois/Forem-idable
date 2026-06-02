"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoachPhaseFilter } from "@/features/coach/types";

const TABS: { value: CoachPhaseFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "internship_search", label: "Recherche stage" },
  { value: "job_search", label: "Recherche emploi" },
  { value: "placed", label: "En emploi" },
  { value: "dropped", label: "Sortie du dispositif" },
];

interface CoachPhaseTabsProps {
  value: CoachPhaseFilter;
  onValueChange: (value: CoachPhaseFilter) => void;
  counts?: Record<CoachPhaseFilter, number>;
}

export function CoachPhaseTabs({ value, onValueChange, counts }: CoachPhaseTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as CoachPhaseFilter)}>
      <TabsList className="flex-wrap h-auto">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
            {tab.label}
            {counts && counts[tab.value] > 0 ? (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                {counts[tab.value]}
              </span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
