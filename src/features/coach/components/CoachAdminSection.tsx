"use client";

import { useMemo, useState } from "react";
import { ShieldPlus, ShieldX } from "lucide-react";
import { UserPickerDialog } from "@/components/coach/UserPickerDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LocalPagination } from "@/components/ui/local-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCoachDate, getCoachUserDisplayName } from "@/features/coach/utils";
import { CoachGroupSummary, CoachUserSummary } from "@/types/coach";

interface CoachAdminSectionProps {
  coaches: CoachUserSummary[];
  groups: CoachGroupSummary[];
  promotableUsers: CoachUserSummary[];
  isPromoteCoachOpen: boolean;
  onPromoteCoachOpenChange: (open: boolean) => void;
  onPromoteCoach: (userId: number) => void;
  onDemoteCoach: (userId: number) => void;
}

export function CoachAdminSection({
  coaches,
  groups,
  promotableUsers,
  isPromoteCoachOpen,
  onPromoteCoachOpenChange,
  onPromoteCoach,
  onDemoteCoach,
}: CoachAdminSectionProps) {
  const [demotionTargetId, setDemotionTargetId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const demotionTarget = coaches.find((entry) => entry.id === demotionTargetId) ?? null;
  const demotionSummary = useMemo(() => {
    if (!demotionTarget) return null;

    const coachedGroups = groups
      .filter((group) => group.coaches.some((coach) => coach.id === demotionTarget.id))
      .map((group) => group.name);
    const managedGroups = groups
      .filter((group) => group.managerCoachId === demotionTarget.id)
      .map((group) => group.name);

    return {
      coachedGroups,
      managedGroups,
    };
  }, [demotionTarget, groups]);
  const filteredCoaches = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return coaches;

    return coaches.filter((entry) =>
      [entry.firstName, entry.lastName, entry.email].join(" ").toLowerCase().includes(normalizedSearch)
    );
  }, [coaches, search]);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredCoaches.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleCoaches = useMemo(
    () => filteredCoaches.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredCoaches, safePage]
  );

  return (
    <Card className="gap-4 border-border/60 bg-card py-0">
      <CardHeader className="border-b border-border/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">Administration des coachs</CardTitle>
            <CardDescription>
              Gestion des accès coach, des promotions globales et des rétrogradations.
            </CardDescription>
          </div>
          <Button type="button" onClick={() => onPromoteCoachOpenChange(true)}>
            <ShieldPlus data-icon="inline-start" />
            Promouvoir un coach
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        <FieldGroup className="mb-4 gap-3">
          <Field>
            <FieldLabel htmlFor="admin-coach-search">Recherche</FieldLabel>
            <Input
              id="admin-coach-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Nom ou email..."
            />
          </Field>
        </FieldGroup>
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredCoaches.length > 0 ? (
            visibleCoaches.map((entry) => {
              const coachedGroups = groups
                .filter((group) => group.coaches.some((coach) => coach.id === entry.id))
                .map((group) => group.name);
              const managedGroups = groups
                .filter((group) => group.managerCoachId === entry.id)
                .map((group) => group.name);

              return (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{getCoachUserDisplayName(entry)}</p>
                      <Badge variant="secondary">coach</Badge>
                    </div>
                    <p className="break-all text-xs text-muted-foreground">
                      {entry.email}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {coachedGroups.length > 0
                          ? `${coachedGroups.length} groupe${coachedGroups.length > 1 ? "s" : ""} coaché${coachedGroups.length > 1 ? "s" : ""}`
                          : "Aucun groupe coaché"}
                      </Badge>
                      {managedGroups.length > 0 ? (
                        <Badge variant="outline">
                          {managedGroups.length} groupe{managedGroups.length > 1 ? "s" : ""} managé{managedGroups.length > 1 ? "s" : ""}
                        </Badge>
                      ) : null}
                      <Badge variant="outline">
                        Connexion: {formatCoachDate(entry.lastSeenAt, true)}
                      </Badge>
                      <Badge variant="outline">
                        Action: {formatCoachDate(entry.lastCoachActionAt, true)}
                      </Badge>
                    </div>
                    {(coachedGroups.length > 0 || managedGroups.length > 0) ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {coachedGroups.length > 0 ? `Coaché: ${coachedGroups.join(" • ")}` : null}
                        {coachedGroups.length > 0 && managedGroups.length > 0 ? " • " : null}
                        {managedGroups.length > 0 ? `Manager: ${managedGroups.join(" • ")}` : null}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDemotionTargetId(entry.id)}
                  >
                    <ShieldX data-icon="inline-start" />
                    Rétrograder
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Aucun coach pour l&apos;instant.
            </div>
          )}
        </div>

        {filteredCoaches.length > 0 ? (
          <div className="mt-4">
              <LocalPagination
              currentPage={safePage}
              pageCount={pageCount}
              totalCount={filteredCoaches.length}
              pageSize={pageSize}
              itemLabel="coachs"
              compact
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </CardContent>

      <UserPickerDialog
        open={isPromoteCoachOpen}
        onOpenChange={onPromoteCoachOpenChange}
        title="Promouvoir un utilisateur en coach"
        description="Seuls les comptes utilisateur classiques sont proposés ici."
        users={promotableUsers}
        onSelect={(entry) => onPromoteCoach(entry.id)}
      />

      <Dialog
        open={Boolean(demotionTarget)}
        onOpenChange={(open) => !open && setDemotionTargetId(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rétrograder ce coach ?</DialogTitle>
            <DialogDescription>
              {demotionTarget
                ? `${demotionTarget.email} perdra son rôle coach, ses attributions de groupe et ses éventuels rôles de manager.`
                : "Ce coach perdra son rôle."}
            </DialogDescription>
          </DialogHeader>
          {demotionSummary ? (
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <p className="font-medium text-foreground">Groupes attribués</p>
                <p>
                  {demotionSummary.coachedGroups.length > 0
                    ? demotionSummary.coachedGroups.join(" • ")
                    : "Aucun groupe attribué"}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Groupes managés</p>
                <p>
                  {demotionSummary.managedGroups.length > 0
                    ? demotionSummary.managedGroups.join(" • ")
                    : "Aucun groupe managé"}
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDemotionTargetId(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!demotionTarget) return;
                onDemoteCoach(demotionTarget.id);
                setDemotionTargetId(null);
              }}
            >
              Confirmer la rétrogradation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
