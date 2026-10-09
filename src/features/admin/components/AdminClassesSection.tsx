"use client";

import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, GraduationCap, Plus, UserPlus, Users } from "lucide-react";
import { UserPickerDialog } from "@/components/coach/UserPickerDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAdminClasses } from "@/features/admin/useAdminClasses";
import { labels } from "@/features/labels";
import { CoachGroupSummary, CoachUserSummary } from "@/types/coach";

interface AdminClassesSectionProps {
  groups: CoachGroupSummary[];
  users: CoachUserSummary[];
  isLoading: boolean;
  onRefresh: () => Promise<void> | void;
}

export function AdminClassesSection({
  groups,
  users,
  isLoading,
  onRefresh,
}: AdminClassesSectionProps) {
  const classes = useAdminClasses({ refresh: onRefresh });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [memberGroup, setMemberGroup] = useState<CoachGroupSummary | null>(null);
  const [coachGroup, setCoachGroup] = useState<CoachGroupSummary | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CoachGroupSummary | null>(null);

  const [newMember, setNewMember] = useState({ firstName: "", lastName: "", email: "" });

  const beneficiaries = useMemo(
    () => users.filter((entry) => entry.role === "user"),
    [users]
  );

  const memberCandidates = useMemo(() => {
    if (!memberGroup) return [];
    const existing = new Set(memberGroup.members.map((member) => member.id));
    return beneficiaries.filter((entry) => !existing.has(entry.id));
  }, [beneficiaries, memberGroup]);

  const assignableCoaches = useMemo(
    () => users.filter((entry) => entry.role === "coach" || entry.role === "admin"),
    [users]
  );

  const coachCandidates = useMemo(() => {
    if (!coachGroup) return [];
    const existing = new Set(coachGroup.coaches.map((coach) => coach.id));
    return assignableCoaches.filter((entry) => !existing.has(entry.id));
  }, [assignableCoaches, coachGroup]);

  const closeMemberDialog = (open: boolean) => {
    if (!open) {
      setMemberGroup(null);
      setNewMember({ firstName: "", lastName: "", email: "" });
    }
  };

  const canCreateMember =
    newMember.firstName.trim().length > 0 &&
    newMember.lastName.trim().length > 0 &&
    newMember.email.trim().length > 0;

  return (
    <Card id="classes" className="gap-4 border-border/60 bg-card py-0">
      <CardHeader className="border-b border-border/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">{labels.classPlural}</CardTitle>
            <CardDescription>
              Créez des {labels.classPlural.toLowerCase()} et ajoutez-y des{" "}
              {labels.beneficiaryPlural.toLowerCase()} et des {labels.coachPlural.toLowerCase()}.
            </CardDescription>
          </div>
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Créer une classe
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Aucune classe pour l&apos;instant. Créez la première pour commencer.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{group.name}</p>
                    {group.archivedAt ? <Badge variant="outline">Archivée</Badge> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      <Users data-icon="inline-start" />
                      {group.members.length}
                    </Badge>
                    <Badge variant="secondary">
                      <GraduationCap data-icon="inline-start" />
                      {group.coaches.length}
                    </Badge>
                  </div>
                </div>

                {group.members.length > 0 || group.coaches.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {group.members.length > 0
                      ? `${labels.beneficiaryPlural}: ${group.members
                          .map((member) => `${member.firstName} ${member.lastName}`.trim() || member.email)
                          .join(" • ")}`
                      : null}
                    {group.members.length > 0 && group.coaches.length > 0 ? " — " : null}
                    {group.coaches.length > 0
                      ? `${labels.coachPlural}: ${group.coaches
                          .map((coach) => `${coach.firstName} ${coach.lastName}`.trim() || coach.email)
                          .join(" • ")}`
                      : null}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setMemberGroup(group)}
                  >
                    <UserPlus data-icon="inline-start" />
                    Ajouter un {labels.beneficiarySingular.toLowerCase()}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCoachGroup(group)}
                  >
                    <GraduationCap data-icon="inline-start" />
                    Assigner un coach
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setArchiveTarget(group)}
                  >
                    {group.archivedAt ? (
                      <ArchiveRestore data-icon="inline-start" />
                    ) : (
                      <Archive data-icon="inline-start" />
                    )}
                    {group.archivedAt ? "Réactiver" : "Archiver"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create class */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setNewClassName("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une classe</DialogTitle>
            <DialogDescription>
              Donnez un nom à la classe (par ex. « Promotion 2026 »).
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="admin-new-class-name">Nom de la classe</FieldLabel>
            <Input
              id="admin-new-class-name"
              value={newClassName}
              onChange={(event) => setNewClassName(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={newClassName.trim().length === 0 || classes.isCreatingClass}
              onClick={async () => {
                const ok = await classes.createClass(newClassName.trim());
                if (ok) setIsCreateOpen(false);
              }}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add member: pick existing or create new */}
      <Dialog open={Boolean(memberGroup)} onOpenChange={closeMemberDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un {labels.beneficiarySingular.toLowerCase()}</DialogTitle>
            <DialogDescription>
              {memberGroup ? `Classe : ${memberGroup.name}` : null}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Bénéficiaires existants</p>
              {memberCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun bénéficiaire disponible. Créez-en un ci-dessous.
                </p>
              ) : (
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                  {memberCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {`${candidate.firstName} ${candidate.lastName}`.trim() || candidate.email}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{candidate.email}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!memberGroup) return;
                          await classes.addMember(memberGroup.id, candidate.id);
                        }}
                      >
                        Ajouter
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-medium">Créer un nouveau bénéficiaire</p>
              <FieldGroup className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="admin-new-member-first-name">Prénom</FieldLabel>
                    <Input
                      id="admin-new-member-first-name"
                      value={newMember.firstName}
                      onChange={(event) =>
                        setNewMember((current) => ({ ...current, firstName: event.target.value }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="admin-new-member-last-name">Nom</FieldLabel>
                    <Input
                      id="admin-new-member-last-name"
                      value={newMember.lastName}
                      onChange={(event) =>
                        setNewMember((current) => ({ ...current, lastName: event.target.value }))
                      }
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="admin-new-member-email">Email</FieldLabel>
                  <Input
                    id="admin-new-member-email"
                    type="email"
                    value={newMember.email}
                    onChange={(event) =>
                      setNewMember((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </Field>
              </FieldGroup>
              <Button
                type="button"
                disabled={!canCreateMember || classes.isCreatingBeneficiary}
                onClick={async () => {
                  if (!memberGroup) return;
                  const ok = await classes.createAndAddBeneficiary(memberGroup.id, {
                    email: newMember.email.trim(),
                    firstName: newMember.firstName.trim(),
                    lastName: newMember.lastName.trim(),
                  });
                  if (ok) {
                    setNewMember({ firstName: "", lastName: "", email: "" });
                  }
                }}
              >
                Créer et ajouter
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => closeMemberDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign coach */}
      <UserPickerDialog
        open={Boolean(coachGroup)}
        onOpenChange={(open) => !open && setCoachGroup(null)}
        title="Assigner un coach"
        description={coachGroup ? `Classe : ${coachGroup.name}` : ""}
        users={coachCandidates}
        onSelect={(entry) => {
          if (!coachGroup) return;
          void classes.assignCoach(coachGroup.id, entry.id);
        }}
      />

      {/* Archive confirm */}
      <Dialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {archiveTarget?.archivedAt ? "Réactiver la classe ?" : "Archiver la classe ?"}
            </DialogTitle>
            <DialogDescription>
              {archiveTarget?.archivedAt
                ? "La classe redeviendra visible et opérationnelle."
                : "La classe sera masquée sans être supprimée. Vous pourrez la réactiver plus tard."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setArchiveTarget(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!archiveTarget) return;
                const archived = !archiveTarget.archivedAt;
                const ok = await classes.archiveClass(archiveTarget.id, archived);
                if (ok) setArchiveTarget(null);
              }}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
