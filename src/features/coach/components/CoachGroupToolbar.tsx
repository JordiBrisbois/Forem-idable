"use client";

import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { CoachPhaseFilter, CoachUserFilter } from "@/features/coach/types";

interface CoachGroupToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  phaseFilter: CoachPhaseFilter;
  onPhaseFilterChange: (value: CoachPhaseFilter) => void;
  phaseCounts: Record<CoachPhaseFilter, number>;
  userFilter: CoachUserFilter;
  onUserFilterChange: (value: CoachUserFilter) => void;
  filterOptions: Array<{ value: CoachUserFilter; label: string }>;
}

const PHASE_LABELS: Record<CoachPhaseFilter, string> = {
  all: "Tous",
  internship_search: "Stage",
  job_search: "Emploi",
  placed: "En emploi",
  dropped: "Sortis",
};

const QUICK_CHIPS: Array<{ value: CoachUserFilter; label: string; variant: "default" | "destructive" | "warning" }> = [
  { value: "all", label: "Tous", variant: "default" },
  { value: "urgent", label: "Urgent", variant: "destructive" },
  { value: "due", label: "Relances", variant: "warning" },
  { value: "interviews", label: "Entretiens", variant: "default" },
  { value: "inactive", label: "Inactifs", variant: "default" },
];

export function CoachGroupToolbar({
  search,
  onSearchChange,
  phaseFilter,
  onPhaseFilterChange,
  phaseCounts,
  userFilter,
  onUserFilterChange,
  filterOptions,
}: CoachGroupToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Barre sticky */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-sm min-w-0">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un bénéficiaire..."
            className="pl-9 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={phaseFilter} onValueChange={(v) => onPhaseFilterChange(v as CoachPhaseFilter)}>
          <SelectTrigger className="w-[120px] sm:w-[150px]">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PHASE_LABELS) as CoachPhaseFilter[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PHASE_LABELS[key]} ({phaseCounts[key]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(userFilter !== "all" && "border-primary text-primary")}
            >
              <Filter className="mr-1.5 h-4 w-4" />
              Filtres
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Filtrer par état
              </p>
              <ToggleGroup
                type="single"
                variant="outline"
                value={userFilter}
                onValueChange={(v) => {
                  if (v) onUserFilterChange(v as CoachUserFilter);
                }}
                className="flex flex-col gap-1.5"
              >
                {filterOptions.map((opt) => (
                  <ToggleGroupItem
                    key={opt.value}
                    value={opt.value}
                    className="w-full justify-start"
                  >
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Chips rapides */}
      <div className="flex flex-wrap gap-1.5 pb-1 min-w-0">
        {QUICK_CHIPS.map((chip) => {
          const isActive = userFilter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onUserFilterChange(chip.value)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive && chip.variant === "default" && "border-primary bg-primary text-primary-foreground",
                isActive && chip.variant === "destructive" && "border-destructive bg-destructive text-white",
                isActive && chip.variant === "warning" && "border-[#F2C27A] bg-[#FFF5E8] text-[#A46110] dark:border-[#6D4B1E] dark:bg-[#2A1D0F] dark:text-[#F2C27A]",
                !isActive && "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
