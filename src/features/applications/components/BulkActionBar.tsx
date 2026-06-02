"use client";

import { BellOff, BellRing, Check, ChevronsUpDown, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BULK_APPLICATION_STATUS_OPTIONS } from "@/features/applications/utils";
import { ApplicationStatus } from "@/types/application";

interface BulkActionBarProps {
  selectedCount: number;
  selectedFollowUpCount: number;
  selectedFollowUpDisabledCount: number;
  isBusy: boolean;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onDisableFollowUp: () => void;
  onEnableFollowUp: () => void;
  onChangeStatus: (status: ApplicationStatus) => void;
}

export function BulkActionBar({
  selectedCount,
  selectedFollowUpCount,
  selectedFollowUpDisabledCount,
  isBusy,
  isAllSelected,
  onToggleSelectAll,
  onClearSelection,
  onDeleteSelected,
  onDisableFollowUp,
  onEnableFollowUp,
  onChangeStatus,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <section
      role="toolbar"
      aria-label="Actions sur la sélection"
      aria-busy={isBusy}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-6xl flex-wrap items-center gap-2 rounded-xl border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/85 animate-in slide-in-from-bottom-4 duration-300 min-w-0"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 text-xs"
        aria-label={isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
        onClick={onToggleSelectAll}
        disabled={isBusy}
      >
        <Check data-icon="inline-start" />
        {isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
      </Button>

      <span className="text-sm font-medium tabular-nums">
        {selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""}
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Réactiver les relances pour ${selectedFollowUpDisabledCount} candidature${selectedFollowUpDisabledCount > 1 ? "s" : ""}`}
          onClick={onEnableFollowUp}
          disabled={isBusy || selectedFollowUpDisabledCount === 0}
        >
          <BellRing data-icon="inline-start" />
          <span className="hidden sm:inline">
            Réactiver{selectedFollowUpDisabledCount > 0 ? ` (${selectedFollowUpDisabledCount})` : ""}
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Désactiver les relances pour ${selectedFollowUpCount} candidature${selectedFollowUpCount > 1 ? "s" : ""}`}
          onClick={onDisableFollowUp}
          disabled={isBusy || selectedFollowUpCount === 0}
        >
          <BellOff data-icon="inline-start" />
          <span className="hidden sm:inline">
            Désactiver{selectedFollowUpCount > 0 ? ` (${selectedFollowUpCount})` : ""}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Changer le statut de la sélection"
              disabled={isBusy}
            >
              <ChevronsUpDown data-icon="inline-start" />
              <span className="hidden sm:inline">Statut</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {BULK_APPLICATION_STATUS_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChangeStatus(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          aria-label={`Supprimer ${selectedCount} candidature${selectedCount > 1 ? "s" : ""}`}
          onClick={onDeleteSelected}
          disabled={isBusy}
        >
          <Trash2 data-icon="inline-start" />
          <span className="hidden sm:inline">Supprimer</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onClearSelection}
          aria-label="Annuler la sélection"
          disabled={isBusy}
        >
          <X />
        </Button>
      </div>
    </section>
  );
}
