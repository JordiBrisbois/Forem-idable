"use client";

import { Badge } from "@/components/ui/badge";
import { getComputedGoalBadge } from "@/features/coach/utils/goalBadge";
import { SearchGoal } from "@/types/preferences";

interface CoachGoalBadgeProps {
  goal: SearchGoal;
  hasAcceptedStage?: boolean;
  hasAcceptedJob?: boolean;
  className?: string;
}

export function CoachGoalBadge({
  goal,
  hasAcceptedStage,
  hasAcceptedJob,
  className,
}: CoachGoalBadgeProps) {
  const computed = getComputedGoalBadge(
    goal,
    hasAcceptedStage ?? false,
    hasAcceptedJob ?? false
  );

  return (
    <Badge variant={computed.variant} className={className}>
      {computed.label}
    </Badge>
  );
}
