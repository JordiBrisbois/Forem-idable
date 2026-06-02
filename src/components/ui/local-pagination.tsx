"use client";

import { Button } from "@/components/ui/button";

interface LocalPaginationProps {
  currentPage: number;
  pageCount: number;
  totalCount: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  compact?: boolean;
}

export function LocalPagination({
  currentPage,
  pageCount,
  totalCount,
  pageSize,
  itemLabel,
  onPageChange,
  compact = false,
}: LocalPaginationProps) {
  if (pageCount <= 1) return null;

  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div
      className={
        compact
          ? "flex flex-col gap-2 rounded-lg border bg-background/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          : "flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      }
    >
      <p className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
        {start}-{end} sur {totalCount} {itemLabel}
      </p>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          type="button"
          size={compact ? "xs" : "sm"}
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Précédent
        </Button>
        <span className={compact ? "min-w-20 text-center text-xs text-muted-foreground" : "min-w-24 text-center text-sm text-muted-foreground"}>
          Page {currentPage} / {pageCount}
        </span>
        <Button
          type="button"
          size={compact ? "xs" : "sm"}
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
