"use client";

import { Download, FileKey2, FilePenLine, FileSpreadsheet, GitBranch, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CoachPhaseBadge } from "@/features/coach/components/CoachPhaseBadge";
import { CoachStatGrid } from "@/features/coach/components/CoachStatGrid";
import { CoachUserActivityMeta } from "@/features/coach/components/CoachUserActivityMeta";
import { getCoachUserDisplayName } from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

interface CoachUserSheetHeaderProps {
  currentUserId: number | undefined;
  isAdmin: boolean;
  canEditUser: boolean;
  canManageApiKeys: boolean;
  user: CoachUserSummary;
  onExport: () => void;
  onOpenApiKeys: () => void;
  onOpenImport: () => void;
  onEdit: () => void;
  onDeleteUser: () => void;
  onOpenPhaseChange: () => void;
}

export function CoachUserSheetHeader({
  currentUserId,
  isAdmin,
  canEditUser,
  canManageApiKeys,
  user,
  onExport,
  onOpenApiKeys,
  onOpenImport,
  onEdit,
  onDeleteUser,
  onOpenPhaseChange,
}: CoachUserSheetHeaderProps) {
  return (
    <SheetHeader className="border-b bg-muted/30 p-5 pr-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle>{getCoachUserDisplayName(user)}</SheetTitle>
            <Badge variant="secondary" className="capitalize">
              {user.role}
            </Badge>
          </div>
          <SheetDescription className="space-y-1">
            <span className="block text-sm">{user.email}</span>
            <span className="block">
              {user.groupNames.length > 0 ? user.groupNames.join(" • ") : "Aucun groupe assigné"}
            </span>
            <CoachUserActivityMeta user={user} as="span" className="block" />
            <CoachPhaseBadge
              phase={user.trackingPhase}
              hasAcceptedStage={user.hasAcceptedStage}
              hasAcceptedJob={user.hasAcceptedJob}
              className="mt-1"
            />
          </SheetDescription>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {(canManageApiKeys || canEditUser || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canManageApiKeys && (
                  <DropdownMenuItem onClick={onOpenApiKeys}>
                    <FileKey2 className="h-4 w-4" />
                    Clés API
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onOpenImport}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Importer un suivi (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenPhaseChange}>
                  <GitBranch className="h-4 w-4" />
                  Changer de phase
                </DropdownMenuItem>
                {canEditUser && (
                  <DropdownMenuItem onClick={onEdit}>
                    <FilePenLine className="h-4 w-4" />
                    Éditer
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    {canManageApiKeys || canEditUser ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={onDeleteUser}
                      disabled={user.id === currentUserId}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="pt-2">
        <CoachStatGrid
          applicationCount={user.applicationCount}
          interviewCount={user.interviewCount}
          dueCount={user.dueCount}
          acceptedCount={user.acceptedCount}
          rejectedCount={user.rejectedCount}
        />
      </div>
    </SheetHeader>
  );
}
