"use client";

import { Badge } from "@/components/ui/badge";
import { BriefcaseBusiness, CalendarClock, CircleAlert, FolderKanban, Scale } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CoachStageFilter } from "@/features/coach/types";
import { BENEFICIARY_STAGE_LABELS, BENEFICIARY_STAGE_ORDER, BeneficiaryStage } from "@/types/beneficiaryStage";

interface CoachSummaryCardsProps {
  userCount: number;
  totalApplications: number;
  totalInterviews: number;
  totalDue: number;
  totalAccepted: number;
  totalRejected: number;
  stageCounts?: Record<CoachStageFilter, number>;
}

const STAGE_BADGE_VARIANTS: Record<
  BeneficiaryStage,
  "default" | "secondary" | "success" | "outline" | "info" | "warning" | "error"
> = {
  internship_search: "info",
  internship_ongoing: "warning",
  job_search: "secondary",
  employed: "success",
  exited: "outline",
};

export function CoachSummaryCards({
  userCount,
  totalApplications,
  totalInterviews,
  totalDue,
  totalAccepted,
  totalRejected,
  stageCounts,
}: CoachSummaryCardsProps) {
  const primaryCards = [
    {
      label: "Bénéficiaires suivis",
      value: String(userCount),
      detail: "Bénéficiaires actuellement suivis dans cette vue coach.",
      badge: "Portefeuille",
      badgeVariant: "secondary" as const,
      icon: BriefcaseBusiness,
    },
    {
      label: "Relances à faire",
      value: String(totalDue),
      detail: "Suivis à reprendre rapidement pour éviter les dossiers qui refroidissent.",
      badge: totalDue > 0 ? "Priorité" : "Sous contrôle",
      badgeVariant: totalDue > 0 ? ("warning" as const) : ("secondary" as const),
      icon: CircleAlert,
    },
    {
      label: "Entretiens à venir",
      value: String(totalInterviews),
      detail: "Entretiens déjà planifiés à préparer et à suivre dans les prochains jours.",
      badge: "Agenda",
      badgeVariant: "outline" as const,
      icon: CalendarClock,
    },
  ];
  const secondaryCards = [
    {
      label: "Candidatures consolidées",
      value: String(totalApplications),
      detail: "Volume total de candidatures visible sur l’ensemble des classes.",
      badge: "Pipeline",
      badgeVariant: "outline" as const,
      icon: FolderKanban,
    },
    {
      label: "Acceptées / refusées",
      value: `${totalAccepted} / ${totalRejected}`,
      detail: "Lecture rapide des issues positives et négatives du portefeuille suivi.",
      badge: "Résultats",
      badgeVariant: "outline" as const,
      icon: Scale,
    },
  ];

  const stageBadges = stageCounts
    ? BENEFICIARY_STAGE_ORDER.map((stage) => ({
        key: stage,
        label: BENEFICIARY_STAGE_LABELS[stage],
        count: stageCounts[stage],
        variant: STAGE_BADGE_VARIANTS[stage],
      })).filter((b) => b.count > 0)
    : [];

  return (
    <div className="flex flex-col gap-3">
      {stageBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stageBadges.map((badge) => (
            <Badge key={badge.key} variant={badge.variant} className="text-xs">
              {badge.label}
              <span className="ml-1.5 rounded-full bg-background/20 px-1.5 py-0.5 tabular-nums">{badge.count}</span>
            </Badge>
          ))}
        </div>
      )}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1.1fr)]">
        <div className="grid gap-3 md:grid-cols-3">
        {primaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.label}
              className="gap-0 border-border/60 bg-card py-0"
            >
              <CardHeader className="gap-4 px-4 py-4 md:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardDescription className="text-xs md:text-sm">
                      {card.label}
                    </CardDescription>
                    <CardTitle className="text-3xl font-black md:text-4xl">
                      {card.value}
                    </CardTitle>
                  </div>
                  <Badge variant={card.badgeVariant}>{card.badge}</Badge>
                </div>
                <div className="flex min-h-12 items-start gap-3">
                  <div className="rounded-md border border-border/60 bg-muted/30 p-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-muted-foreground">{card.detail}</p>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {secondaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.label}
              className="gap-0 border-border/60 bg-card py-0"
            >
              <CardHeader className="gap-3 px-4 py-4 md:px-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardDescription className="text-xs md:text-sm">
                      {card.label}
                    </CardDescription>
                    <CardTitle className="text-2xl font-black md:text-3xl">
                      {card.value}
                    </CardTitle>
                  </div>
                  <Badge variant={card.badgeVariant}>{card.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-16 items-start gap-3 px-4 pb-4 pt-0 md:px-5">
                <div className="rounded-md border border-border/60 bg-muted/30 p-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm text-muted-foreground">{card.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  </div>
  );
}
