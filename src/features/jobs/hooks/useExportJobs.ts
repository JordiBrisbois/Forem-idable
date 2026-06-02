"use client";

import { useState } from "react";
import { runtimeConfig } from "@/config/runtime";
import { Job } from "@/types/job";
import { ExportColumnKey, exportJobsToCSV } from "@/lib/exportCsv";
import { SearchQuery } from "@/types/search";
import { EXPORTABLE_COLUMNS } from "@/features/jobs/constants/exportColumns";
import {
  buildExportMetadata,
  ExportTarget,
  getExportScopeJobs,
} from "@/features/jobs/utils/exportJobs";

export function useExportJobs() {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<ExportTarget>("all");
  const [selectedExportColumns, setSelectedExportColumns] = useState<ExportColumnKey[]>(
    EXPORTABLE_COLUMNS.map((column) => column.key)
  );

  const openExportDialog = (target: ExportTarget) => {
    setExportTarget(target);
    setIsExportDialogOpen(true);
  };

  const selectAllColumns = () =>
    setSelectedExportColumns(EXPORTABLE_COLUMNS.map((column) => column.key));

  const toggleColumn = (column: ExportColumnKey, checked: boolean) => {
    if (checked) {
      setSelectedExportColumns((prev) =>
        prev.includes(column) ? prev : [...prev, column]
      );
    } else {
      setSelectedExportColumns((prev) => prev.filter((value) => value !== column));
    }
  };

  const applyExport = (options: {
    jobs: Job[];
    selectedJobs: Job[];
    lastSearchQuery: SearchQuery | null;
  }) => {
    const exportJobs = getExportScopeJobs(exportTarget, options.jobs, options.selectedJobs);
    if (exportJobs.length === 0) return;

    const metadata = buildExportMetadata({
      target: exportTarget,
      jobsCount: exportJobs.length,
      searchQuery: options.lastSearchQuery,
    });

    exportJobsToCSV(exportJobs, {
      filename: `offres-${runtimeConfig.app.exportFilenamePrefix}.csv`,
      columns: selectedExportColumns,
      metadata,
    });
    setIsExportDialogOpen(false);
  };

  return {
    isExportDialogOpen,
    setIsExportDialogOpen,
    exportTarget,
    selectedExportColumns,
    openExportDialog,
    selectAllColumns,
    toggleColumn,
    applyExport,
  };
}
