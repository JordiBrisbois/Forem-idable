"use client";

import { BellRing, CalendarClock, ChevronRight, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { CoachPrioritySection } from "@/features/coach/utils";

interface CoachPriorityBoardProps {
  sections: CoachPrioritySection[];
  onOpenUser: (userId: number, jobId?: string | null) => void;
}

const SECTION_META: Record<
  CoachPrioritySection["id"],
  {
    icon: typeof CircleAlert;
    tone: "warning" | "info" | "danger";
  }
> = {
  due: {
    icon: CircleAlert,
    tone: "warning",
  },
  interviews: {
    icon: CalendarClock,
    tone: "info",
  },
  inactive: {
    icon: BellRing,
    tone: "danger",
  },
};

export function CoachPriorityBoard({ sections, onOpenUser }: CoachPriorityBoardProps) {
  return (
    <Card id="a-traiter" className="scroll-mt-6 gap-0 border-border/60 bg-card py-0">
      <CardHeader className="border-b border-border/60 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">Priorités du jour</CardTitle>
            <CardDescription>
              Raccourcis coach pour les relances urgentes, les entretiens proches
              et les suivis à reprendre.
            </CardDescription>
          </div>
          <Badge variant="outline">Vue d&apos;action</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid gap-3 xl:grid-cols-3">
          {sections.map((section) => {
            const meta = SECTION_META[section.id];
            const Icon = meta.icon;

            return (
              <Card
                key={section.id}
                className="gap-0 border-border/60 bg-card py-0"
              >
                <CardHeader className="border-b border-border/60 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <CardTitle>{section.title}</CardTitle>
                      </div>
                      <p className="min-h-10 text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant={getPriorityBadgeVariant(meta.tone)}>
                        {section.total}
                      </Badge>
                      <span className="text-xs text-muted-foreground">à ouvrir</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {section.items.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {section.items.slice(0, 5).map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          className="flex w-full animate-in items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-left transition fade-in-0 slide-in-from-bottom-1 hover:border-primary/30 hover:bg-muted/30"
                          style={{ animationDelay: `${index * 40}ms` }}
                          onClick={() => onOpenUser(item.userId, item.jobId)}
                        >
<div className="flex min-w-0 flex-col gap-1">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <p className="truncate font-medium text-foreground">
                                  {item.userName}
                                </p>
                                <Badge variant="outline" className="max-w-[10rem] truncate" title={item.badgeTitle ?? item.badgeLabel}>
                                  {item.badgeLabel}
                                </Badge>
                                <Badge variant={item.computedPhaseVariant} className="text-xs">
                                  {item.computedPhaseLabel}
                                </Badge>
                              </div>
                            <p className="text-sm text-muted-foreground">
                              {item.summary}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.detail}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                              Voir
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      ))}

                      {section.items.length > 5 ? (
                        <p className="px-1 text-xs text-muted-foreground">
                          {section.items.length - 5} autre
                          {section.items.length - 5 > 1 ? "s" : ""} bénéficiaire
                          {section.items.length - 5 > 1 ? "s" : ""} à traiter
                          dans cette vue.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <Empty className="min-h-36 bg-muted/10 p-6">
                      <EmptyHeader>
                        <EmptyTitle>{section.emptyLabel}</EmptyTitle>
                        <EmptyDescription>
                          Aucun élément prioritaire dans cette vue pour le
                          moment.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function getPriorityBadgeVariant(tone: "warning" | "info" | "danger") {
  if (tone === "warning") return "warning";
  if (tone === "danger") return "error";
  return "info";
}
