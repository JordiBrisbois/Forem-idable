"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Job } from "@/types/job";
import { MapPin, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContractTypeBadge } from "./ContractTypeBadge";
import { JobActions } from "./JobActions";
import { JobMobileCard } from "./JobMobileCard";
import { JobTablePagination } from "./JobTablePagination";
import { ShareOfferDialog } from "@/features/jobs/components/ShareOfferDialog";
import {
  formatPublicationDateCompact,
  formatPublicationDateTable,
  buildPaginationItems,
} from "./jobTableUtils";

interface JobTableProps {
  data: Job[];
  resetPaginationToken?: number;
  isLoadingMore?: boolean;
  hasMoreResults?: boolean;
  onLoadMore?: () => void;
  selectedJobIds?: Set<string>;
  onToggleSelection?: (job: Job) => void;
  onOpenDetails?: (job: Job) => void;
  isAuthenticated?: boolean;
  isApplicationsLoaded?: boolean;
  isApplied?: (jobId: string) => boolean;
  onTrackApplication?: (job: Job) => Promise<void> | void;
  onRequireAuth?: (job: Job) => void;
}

const COLUMN_CLASSES: Record<string, { head?: string; cell?: string }> = {
  selection: {
    head: "w-[52px]",
    cell: "w-[52px] align-top",
  },
  title: {
    head: "w-[44%]",
    cell: "w-[44%] whitespace-normal align-top",
  },
  location: {
    head: "hidden sm:table-cell sm:w-[96px] lg:w-[112px]",
    cell: "hidden sm:table-cell sm:w-[96px] lg:w-[112px] align-top",
  },
  contractType: {
    head: "hidden md:table-cell md:w-[92px] lg:w-[104px]",
    cell: "hidden md:table-cell md:w-[92px] lg:w-[104px] whitespace-normal align-top",
  },
  publicationDate: {
    head: "hidden xl:table-cell xl:w-[104px]",
    cell: "hidden xl:table-cell xl:w-[104px] align-top",
  },
  actions: {
    head: "w-[156px] text-right lg:w-[196px]",
    cell: "w-[156px] whitespace-nowrap align-top lg:w-[196px]",
  },
};

export function JobTable({
  data,
  resetPaginationToken,
  isLoadingMore = false,
  hasMoreResults = false,
  onLoadMore,
  selectedJobIds,
  onToggleSelection,
  onOpenDetails,
  isAuthenticated = false,
  isApplicationsLoaded = true,
  isApplied = () => false,
  onTrackApplication,
  onRequireAuth,
}: JobTableProps) {
  const [shareJob, setShareJob] = useState<Job | null>(null);

  const columns: ColumnDef<Job>[] = useMemo(
    () => [
      {
        id: "selection",
        header: () => (
          <span className="sr-only">Sélectionner</span>
        ),
        cell: ({ row }) => {
          const job = row.original;
          if (!onToggleSelection) return null;
          return (
            <SelectionCheckbox
              checked={selectedJobIds?.has(job.id) ?? false}
              onChange={() => onToggleSelection(job)}
              title={
                selectedJobIds?.has(job.id)
                  ? "Retirer de la sélection"
                  : "Ajouter à la sélection"
              }
            />
          );
        },
      },
      {
        accessorKey: "title",
        header: "Offre",
        cell: ({ row }) => {
          const title = row.getValue("title") as string;
          const company = row.original.company;
          const canOpenDetails = Boolean(onOpenDetails);

          return (
            <div className="flex min-w-0 flex-col gap-2">
              <div className="min-w-0">
                <p
                  className={cn(
                    "overflow-hidden text-sm font-semibold leading-6 text-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-[15px]",
                    canOpenDetails
                      ? "group-hover:text-primary group-hover:underline underline-offset-2"
                      : undefined
                  )}
                  title={title}
                >
                  {title}
                </p>
                <p
                  className="truncate text-xs text-muted-foreground sm:text-sm"
                  title={company || "Entreprise non précisée"}
                >
                  {company || "Entreprise non précisée"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground xl:hidden">
                  <CalendarDays className="size-3.5" />
                  {formatPublicationDateCompact(row.original.publicationDate)}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "location",
        header: "Lieu",
        cell: ({ row }) => {
          const location = row.getValue("location") as string;
          return (
            <div className="flex items-start gap-2 pt-0.5 text-sm text-foreground">
              <MapPin className="mt-0.5 size-3.5 text-muted-foreground" />
              <span
                className="max-w-[10ch] truncate"
                title={location || "Lieu non précisé"}
              >
                {location || "Lieu non précisé"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "contractType",
        header: "Contrat",
        cell: ({ row }) => {
          const type = row.getValue("contractType") as string;
          return <ContractTypeBadge contractType={type} />;
        },
      },
      {
        accessorKey: "publicationDate",
        header: "Publication",
        cell: ({ row }) => (
          <span
            className="block text-right text-[11px] text-muted-foreground/90"
            title={row.original.publicationDate}
          >
            {formatPublicationDateTable(row.original.publicationDate)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const job = row.original;
          return (
            <JobActions
              job={job}
              layout="table"
              isSelected={selectedJobIds?.has(job.id) ?? false}
              isAuthenticated={isAuthenticated}
              isApplicationsLoaded={isApplicationsLoaded}
              isApplied={isApplied(job.id)}
              onToggleSelection={onToggleSelection}
              onTrackApplication={onTrackApplication}
              onRequireAuth={onRequireAuth}
              onOpenDetails={onOpenDetails}
              onShareJob={
                isAuthenticated ? (selectedJob) => setShareJob(selectedJob) : undefined
              }
            />
          );
        },
      },
    ],
    [
      selectedJobIds,
      onToggleSelection,
      onOpenDetails,
      isAuthenticated,
      isApplicationsLoaded,
      isApplied,
      onTrackApplication,
      onRequireAuth,
    ]
  );

  // TanStack Table exposes mutable callbacks; React Compiler can't safely memoize it yet.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 15 },
    },
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [resetPaginationToken, table]);

  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();
  const totalCount = data.length;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, pageCount, 1),
    [currentPage, pageCount]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:hidden">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const job = row.original;
            return (
              <JobMobileCard
                key={job.id}
                job={job}
                isSelected={selectedJobIds?.has(job.id) ?? false}
                isAuthenticated={isAuthenticated}
                isApplicationsLoaded={isApplicationsLoaded}
                isApplied={isApplied(job.id)}
                onToggleSelection={onToggleSelection}
                onTrackApplication={onTrackApplication}
                onRequireAuth={onRequireAuth}
                onOpenDetails={onOpenDetails}
                onShareJob={
                  isAuthenticated ? (selectedJob) => setShareJob(selectedJob) : undefined
                }
              />
            );
          })
        ) : (
          <div className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
            Aucune offre ne correspond à vos critères.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-background sm:block">
        <Table className="table-fixed">
          <TableHeader className="bg-muted/35 [&_tr]:border-border/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-11 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
                      COLUMN_CLASSES[header.column.id]?.head
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              <TooltipProvider delayDuration={120}>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      row.index % 2 === 0
                        ? "bg-background"
                        : "bg-muted/30 dark:bg-muted/20",
                      "group border-border/60 hover:bg-muted/45 dark:hover:bg-muted/35 data-[state=selected]:bg-primary/6",
                      onOpenDetails ? "cursor-pointer" : undefined
                    )}
                    onClick={
                      onOpenDetails ? () => onOpenDetails(row.original) : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-3 py-4 align-top",
                          COLUMN_CLASSES[cell.column.id]?.cell
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TooltipProvider>
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-36 text-center text-muted-foreground"
                >
                  Aucune offre ne correspond à vos critères.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <JobTablePagination
        currentPage={currentPage}
        pageCount={pageCount}
        isLoadingMore={isLoadingMore}
        hasMoreResults={hasMoreResults}
        canPreviousPage={table.getCanPreviousPage()}
        canNextPage={table.getCanNextPage()}
        paginationItems={paginationItems}
        startItem={startItem}
        endItem={endItem}
        totalCount={totalCount}
        onPreviousPage={() => table.previousPage()}
        onSelectPage={(page) => table.setPageIndex(page - 1)}
        onNextPage={() => table.nextPage()}
        onLoadMore={onLoadMore}
      />

      <ShareOfferDialog
        job={shareJob}
        open={Boolean(shareJob)}
        onOpenChange={(open) => {
          if (!open) setShareJob(null);
        }}
      />
    </div>
  );
}

function SelectionCheckbox({
  checked,
  onChange,
  title,
}: {
  checked: boolean;
  onChange: () => void;
  title?: string;
}) {
  return (
    <label
      className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
      onClick={(event) => event.stopPropagation()}
    >
      <Checkbox
        checked={checked}
        onClick={(event) => event.stopPropagation()}
        onCheckedChange={() => onChange()}
        title={title}
        aria-label="Sélectionner l'offre"
      />
    </label>
  );
}
