"use client";

import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UnreadMessagesBadgeProps {
  count: number;
  onClick: () => void;
}

export function UnreadMessagesBadge({ count, onClick }: UnreadMessagesBadgeProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-30 flex justify-center md:bottom-24">
      <Button
        type="button"
        size="sm"
        className={cn(
          "pointer-events-auto h-8 gap-1.5 rounded-full px-3 shadow-lg transition-all",
          count > 0 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
        onClick={onClick}
      >
        <ArrowDown className="size-3.5" />
        <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[11px]">
          {count}
        </Badge>
        <span className="text-xs">Nouveau{count > 1 ? "x" : ""}</span>
      </Button>
    </div>
  );
}
