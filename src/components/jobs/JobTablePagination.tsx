"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES } from "@/types/search";
import { PaginationItem as PaginationItemType } from "./jobTableUtils";

interface JobTablePaginationProps {
  currentPage: number;
  pageCount: number;
  pageSize: number;
  isLoading: boolean;
  canPreviousPage: boolean;
  canNextPage: boolean;
  paginationItems: PaginationItemType[];
  startItem: number;
  endItem: number;
  totalCount: number;
  onPreviousPage: () => void;
  onSelectPage: (page: number) => void;
  onNextPage: () => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function JobTablePagination({
  currentPage,
  pageCount,
  pageSize,
  isLoading,
  canPreviousPage,
  canNextPage,
  paginationItems,
  startItem,
  endItem,
  totalCount,
  onPreviousPage,
  onSelectPage,
  onNextPage,
  onPageSizeChange,
}: JobTablePaginationProps) {
  if (pageCount <= 1 && !onPageSizeChange) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/15 px-4 py-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {startItem}-{endItem} sur {totalCount} offres
        </p>
        <p className="text-sm text-muted-foreground">
          Page {currentPage} sur {pageCount}
          {isLoading ? " · Chargement..." : ""}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Pagination className="justify-start lg:justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={onPreviousPage} disabled={!canPreviousPage} />
            </PaginationItem>
            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${item}`}>
                  <PaginationLink
                    isActive={item === currentPage}
                    onClick={() => onSelectPage(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext onClick={onNextPage} disabled={!canNextPage} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Par page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-9 w-[84px] rounded-full" aria-label="Offres par page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
    </div>
  );
}
