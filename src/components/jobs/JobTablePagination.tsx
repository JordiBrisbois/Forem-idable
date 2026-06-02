"use client";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PaginationItem as PaginationItemType } from "./jobTableUtils";

interface JobTablePaginationProps {
  currentPage: number;
  pageCount: number;
  isLoadingMore: boolean;
  hasMoreResults: boolean;
  canPreviousPage: boolean;
  canNextPage: boolean;
  paginationItems: PaginationItemType[];
  startItem: number;
  endItem: number;
  totalCount: number;
  onPreviousPage: () => void;
  onSelectPage: (page: number) => void;
  onNextPage: () => void;
  onLoadMore?: () => void;
}

export function JobTablePagination({
  currentPage,
  pageCount,
  isLoadingMore,
  hasMoreResults,
  canPreviousPage,
  canNextPage,
  paginationItems,
  startItem,
  endItem,
  totalCount,
  onPreviousPage,
  onSelectPage,
  onNextPage,
  onLoadMore,
}: JobTablePaginationProps) {
  const showLoadMoreOnLastPage = hasMoreResults && currentPage === pageCount && onLoadMore;

  if (pageCount <= 1 && !showLoadMoreOnLastPage) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/15 px-4 py-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {startItem}-{endItem} sur {totalCount} offres
        </p>
        <p className="text-sm text-muted-foreground">
          Page {currentPage} sur {pageCount}
          {isLoadingMore ? " · Chargement..." : ""}
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
              <PaginationNext
                onClick={showLoadMoreOnLastPage ? onLoadMore : onNextPage}
                disabled={!canNextPage && !showLoadMoreOnLastPage}
              >
                {showLoadMoreOnLastPage ? "Charger plus" : undefined}
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {showLoadMoreOnLastPage ? (
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-full"
          >
            {isLoadingMore ? "Chargement..." : "Charger plus d'offres"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
