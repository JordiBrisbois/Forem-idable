"use client";

import { Badge } from "@/components/ui/badge";
import { getComputedPhaseBadge } from "@/features/coach/utils/phaseBadge";
import { TrackingPhase } from "@/types/coach";

interface CoachPhaseBadgeProps {
  phase: TrackingPhase;
  hasAcceptedStage?: boolean;
  hasAcceptedJob?: boolean;
  className?: string;
}

function PositiveBadge({ className }: { className?: string }) {
  return (
    <Badge variant="success" className={className}>
      Sortie positive
    </Badge>
  );
}

export function CoachPhaseBadge({
  phase,
  hasAcceptedStage,
  hasAcceptedJob,
  className,
}: CoachPhaseBadgeProps) {
  const computed = getComputedPhaseBadge(
    phase,
    hasAcceptedStage ?? false,
    hasAcceptedJob ?? false
  );

  if (computed.label === "Sortie positive") {
    return <PositiveBadge className={className} />;
  }

  return (
    <Badge variant={computed.variant} className={className}>
      {computed.label}
    </Badge>
  );
}
