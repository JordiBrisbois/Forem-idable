"use client";

import { useState } from "react";
import { Check, CheckSquare, Download, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ResultsToolbarProps {
  jobsCount: number;
  selectedCount: number;
  isSearching: boolean;
  onExportAll: () => void;
  onExportSelected: () => void;
  onCopySearchLink: () => Promise<void> | void;
  canCopySearchLink: boolean;
}

export function ResultsToolbar({
  jobsCount,
  selectedCount,
  isSearching,
  onExportAll,
  onExportSelected,
  onCopySearchLink,
  canCopySearchLink,
}: ResultsToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopySearchLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Résultats de recherche
            </h2>
            <Badge variant="secondary">{jobsCount}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {jobsCount} offre{jobsCount > 1 ? "s" : ""} trouvée{jobsCount > 1 ? "s" : ""}
            {selectedCount > 0
              ? ` • ${selectedCount} sélectionnée${selectedCount > 1 ? "s" : ""}`
              : ""}
          </p>
        </div>

        {!isSearching && jobsCount > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full sm:w-auto"
              onClick={onExportAll}
            >
              <Download data-icon="inline-start" />
              Exporter en CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full sm:w-auto"
              onClick={handleCopy}
              disabled={!canCopySearchLink}
            >
              {copied ? <Check data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
              {copied ? "Lien copié" : "Copier la recherche"}
            </Button>
            {selectedCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full sm:w-auto"
                onClick={onExportSelected}
              >
                <CheckSquare data-icon="inline-start" />
                Exporter la sélection
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
