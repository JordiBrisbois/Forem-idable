"use client";

import { ExportColumnKey } from "@/lib/exportCsv";
import { EXPORTABLE_COLUMNS } from "@/features/jobs/constants/exportColumns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportTarget: "all" | "selected";
  jobsCount: number;
  selectedCount: number;
  selectedColumns: ExportColumnKey[];
  onToggleColumn: (column: ExportColumnKey, checked: boolean) => void;
  onSelectAllColumns: () => void;
  onExport: () => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  exportTarget,
  jobsCount,
  selectedCount,
  selectedColumns,
  onToggleColumn,
  onSelectAllColumns,
  onExport,
}: ExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Export CSV avancé</DialogTitle>
          <DialogDescription>
            Choisissez les colonnes à exporter. Les filtres de recherche actifs seront ajoutés en en-tête.
          </DialogDescription>
          <div className="pt-1">
            <Badge variant="outline" className="rounded-full">
              Portée{" "}
              {exportTarget === "selected"
                ? `Sélection (${selectedCount} offre${selectedCount > 1 ? "s" : ""})`
                : `Tous les résultats (${jobsCount})`}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3">
          {EXPORTABLE_COLUMNS.map((column) => {
            const checked = selectedColumns.includes(column.key);
            return (
              <label
                key={column.key}
                className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition-colors hover:border-border/60 hover:bg-background/80"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(nextChecked) => onToggleColumn(column.key, Boolean(nextChecked))}
                />
                <span className="font-medium text-foreground">{column.label}</span>
              </label>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onSelectAllColumns}>
            Tout sélectionner
          </Button>
          <Button onClick={onExport} disabled={selectedColumns.length === 0}>
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
