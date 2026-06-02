"use client";

import { getContractBadgeClass, getContractBadgeLabel } from "@/features/jobs/utils/contractBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ContractTypeBadgeProps {
  contractType: string;
  className?: string;
}

export function ContractTypeBadge({ contractType, className = "" }: ContractTypeBadgeProps) {
  const fullLabel = contractType || "N/A";
  const shortLabel = getContractBadgeLabel(fullLabel);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          title={fullLabel}
          className={`inline-flex max-w-[180px] items-center rounded-full border px-2.5 py-1 text-[11px] leading-none font-medium whitespace-nowrap overflow-hidden text-ellipsis ${getContractBadgeClass(fullLabel)} ${className}`.trim()}
        >
          {shortLabel || "N/A"}
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{fullLabel}</TooltipContent>
    </Tooltip>
  );
}
