"use client";

import { Circle, Clock, UserCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCoachDate } from "@/features/coach/utils";
import { formatRelativeTime } from "@/features/coach/utils/relativeTime";
import { CoachUserSummary } from "@/types/coach";

interface CoachUserActivityMetaProps {
  user: Pick<CoachUserSummary, "role" | "lastSeenAt" | "lastCoachActionAt" | "latestActivityAt">;
  as?: "p" | "span";
  className?: string;
  firstItemClassName?: string;
  compact?: boolean;
}

function ActivityIcon({
  icon: Icon,
  label,
  relative,
  className,
  tooltip,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  relative: string;
  className?: string;
  tooltip?: string;
}) {
  const content = (
    <span className={className}>
      <Icon className="mr-1 inline-block size-3 shrink-0" aria-hidden="true" />
      <span className="sr-only">{label}: </span>
      {relative}
    </span>
  );

  if (!tooltip) return content;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" sideOffset={4}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function buildTooltip(label: string, absolute: string) {
  return absolute !== "N/A" ? `${label}: ${absolute}` : undefined;
}

export function CoachUserActivityMeta({
  user,
  as = "p",
  className,
  firstItemClassName,
  compact = false,
}: CoachUserActivityMetaProps) {
  const Tag = as;

  const lastSeenText = formatRelativeTime(user.lastSeenAt) ?? "N/A";
  const lastSeenTooltip = buildTooltip("Dernière connexion", formatCoachDate(user.lastSeenAt, true));
  const isCoach = user.role === "coach" || user.role === "admin";
  const actionText = formatRelativeTime(isCoach ? user.lastCoachActionAt : user.latestActivityAt) ?? "N/A";
  const actionLabel = isCoach ? "Dernière action coach" : "Dernière activité";
  const actionTooltip = buildTooltip(
    actionLabel,
    formatCoachDate(isCoach ? user.lastCoachActionAt : user.latestActivityAt, isCoach || undefined)
  );

  if (compact) {
    return (
      <div className={firstItemClassName ?? className}>
        <ActivityIcon
          icon={Clock}
          label="Dernière connexion"
          relative={lastSeenText}
          className={className}
          tooltip={lastSeenTooltip}
        />
        <ActivityIcon
          icon={isCoach ? UserCheck : Circle}
          label={actionLabel}
          relative={actionText}
          className={className}
          tooltip={actionTooltip}
        />
      </div>
    );
  }

  return (
    <>
      <Tag className={firstItemClassName ?? className}>
        Dernière connexion: {formatCoachDate(user.lastSeenAt, true)}
      </Tag>
      {isCoach ? (
        <Tag className={className}>
          Dernière action coach: {formatCoachDate(user.lastCoachActionAt, true)}
        </Tag>
      ) : (
        <Tag className={className}>Dernière activité: {formatCoachDate(user.latestActivityAt)}</Tag>
      )}
    </>
  );
}
