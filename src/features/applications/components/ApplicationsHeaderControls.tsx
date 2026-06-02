"use client";

import { CalendarDays, Download, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ApplicationsHeaderControlsProps {
  displayedCount: number;
  totalCount: number;
  dueCount: number;
  dueSummary: string;
  canExportCalendar: boolean;
  onCreateManual: () => void;
  onExportCsv: () => void;
  onExportCalendar: () => void;
}

export function ApplicationsHeaderControls({
  displayedCount,
  totalCount,
  dueCount,
  dueSummary,
  canExportCalendar,
  onCreateManual,
  onExportCsv,
  onExportCalendar,
}: ApplicationsHeaderControlsProps) {
  return (
    <Card className="border-border/60 py-0">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            {displayedCount} candidature{displayedCount > 1 ? "s" : ""} affichée
            {displayedCount > 1 ? "s" : ""}
            {displayedCount !== totalCount ? ` sur ${totalCount}` : ""}
          </p>
          <p className="text-sm font-medium text-foreground">
            {dueCount > 0
              ? `${dueCount} relance${dueCount > 1 ? "s" : ""} à faire : ${dueSummary}`
              : "Aucune relance urgente"}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 self-start sm:w-auto sm:self-auto">
          <Button type="button" className="flex-1 sm:flex-none" onClick={onCreateManual}>
            <Plus data-icon="inline-start" />
            <span className="sm:hidden">Ajouter</span>
            <span className="hidden sm:inline">Ajouter manuellement</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1 sm:flex-none"
            onClick={onExportCsv}
            disabled={displayedCount === 0}
          >
            <Download data-icon="inline-start" />
            Exporter en CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                <MoreHorizontal data-icon="inline-start" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={onExportCalendar} disabled={!canExportCalendar}>
                  <CalendarDays />
                  Exporter les entretiens
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}