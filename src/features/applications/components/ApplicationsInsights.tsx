"use client";

import { Filter, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ApplicationModeFilter } from "@/features/applications/utils";
import { cn } from "@/lib/utils";

interface ApplicationsInsightsProps {
  totalCount: number;
  dueCount: number;
  upcomingInterviewCount: number;
  closedCount: number;
  coachUpdateCount: number;
  hasCoachContext: boolean;
  search: string;
  modeFilter: ApplicationModeFilter;
  onSearchChange: (value: string) => void;
  onModeFilterChange: (value: ApplicationModeFilter) => void;
}

export function ApplicationsInsights({
  totalCount,
  dueCount,
  upcomingInterviewCount,
  closedCount,
  coachUpdateCount,
  hasCoachContext,
  search,
  modeFilter,
  onSearchChange,
  onModeFilterChange,
}: ApplicationsInsightsProps) {
  const stats: Array<{ label: string; value: number; hint?: string | null }> = [
    {
      label: "En suivi",
      value: totalCount,
    },
    {
      label: "Relances dues",
      value: dueCount,
    },
    {
      label: "Entretiens à venir",
      value: upcomingInterviewCount,
    },
    {
      label: "Clôturées",
      value: closedCount,
    },
  ];
  const visibleStats = hasCoachContext
    ? [
        ...stats,
        {
          label: "Retours coach",
          value: coachUpdateCount,
          hint:
            coachUpdateCount > 0
              ? `${coachUpdateCount} candidature${coachUpdateCount > 1 ? "s" : ""} avec un nouveau retour coach.`
              : null,
        },
      ]
    : stats;
  const quickFilters: Array<{ value: ApplicationModeFilter; label: string }> = [
    { value: "all", label: "Tout" },
    { value: "due", label: "Relances" },
    { value: "interviews", label: "Entretiens" },
    ...(hasCoachContext ? [{ value: "coach_updates" as const, label: "Nouveaux retours" }] : []),
    { value: "manual", label: "Manuel" },
  ];

  return (
    <>
      <Card className="gap-0 border-border/60 py-0">
        <CardHeader className="gap-2 p-4">
          <CardTitle className="text-base">Vue d&apos;ensemble</CardTitle>
          <CardDescription>
            Repères rapides sur le volume, le suivi et les signaux à traiter.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className={`grid gap-3 sm:grid-cols-2 ${visibleStats.length === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
            {visibleStats.map((stat) => (
              <StatCell key={stat.label} stat={stat} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 border-border/60 py-0">
        <CardContent className="p-4">
          <div className="grid gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Rechercher une entreprise, un poste, une note..."
                className="pl-9"
              />
            </div>
            <ToggleGroup
              type="single"
              variant="outline"
              value={modeFilter}
              onValueChange={(value) => {
                if (value) {
                  onModeFilterChange(value as ApplicationModeFilter);
                }
              }}
              className="grid w-full grid-cols-2 gap-2 lg:hidden"
            >
              {quickFilters.map((filter, index) => {
                const isLastOddItem =
                  quickFilters.length % 2 === 1 && index === quickFilters.length - 1;

                return (
                  <ToggleGroupItem
                    key={filter.value}
                    value={filter.value}
                    size="sm"
                    aria-label={`Filtrer: ${filter.label}`}
                    className={cn(
                      "w-full justify-center rounded-md border shadow-none data-[spacing=0]:rounded-md data-[spacing=0]:border data-[spacing=0]:first:rounded-md data-[spacing=0]:last:rounded-md",
                      "data-[spacing=0]:data-[variant=outline]:border-l data-[spacing=0]:data-[variant=outline]:first:border-l",
                      isLastOddItem && "col-span-2"
                    )}
                  >
                    {filter.value === "all" ? <Filter data-icon="inline-start" /> : null}
                    {filter.label}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
            <ToggleGroup
              type="single"
              variant="outline"
              value={modeFilter}
              onValueChange={(value) => {
                if (value) {
                  onModeFilterChange(value as ApplicationModeFilter);
                }
              }}
              className={`hidden w-full lg:grid ${quickFilters.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
            >
              {quickFilters.map((filter) => (
                <ToggleGroupItem
                  key={filter.value}
                  value={filter.value}
                  size="sm"
                  aria-label={`Filtrer: ${filter.label}`}
                  className="w-full justify-center"
                >
                  {filter.value === "all" ? <Filter data-icon="inline-start" /> : null}
                  {filter.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function StatCell({ stat }: { stat: { label: string; value: number; hint?: string | null } }) {
  const colors = getStatColors(stat.label);
  return (
    <div className={`rounded-lg border px-3 py-3 ${colors}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
        {stat.label}
      </p>
      <p className="mt-2 text-2xl font-black text-foreground">{stat.value}</p>
      {stat.hint ? (
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{stat.hint}</p>
      ) : null}
    </div>
  );
}

function getStatColors(label: string): string {
  switch (label) {
    case "Relances dues":
      return "border-[#F2C27A] bg-[#FFF5E8] dark:border-[#6D4B1E] dark:bg-[#2A1D0F]";
    case "Entretiens à venir":
      return "border-[#9FCAE8] bg-[#EEF6FC] dark:border-[#2A5573] dark:bg-[#10202B]";
    case "Retours coach":
      return "border-[#B8C5E0] bg-[#EFF2F8] dark:border-[#2A3B5A] dark:bg-[#121A2B]";
    default:
      return "border-border/60 bg-muted/20";
  }
}
