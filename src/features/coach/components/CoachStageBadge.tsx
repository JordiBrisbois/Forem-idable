"use client";

import { Badge } from "@/components/ui/badge";
import {
  BENEFICIARY_STAGE_LABELS,
  BeneficiaryStage,
} from "@/types/beneficiaryStage";

const STAGE_VARIANTS: Record<
  BeneficiaryStage,
  "default" | "secondary" | "success" | "outline" | "info" | "warning" | "error"
> = {
  internship_search: "info",
  internship_ongoing: "warning",
  job_search: "secondary",
  employed: "success",
  exited: "outline",
};

export function CoachStageBadge({
  stage,
  className,
}: {
  stage: BeneficiaryStage;
  className?: string;
}) {
  return (
    <Badge variant={STAGE_VARIANTS[stage]} className={className}>
      {BENEFICIARY_STAGE_LABELS[stage]}
    </Badge>
  );
}
