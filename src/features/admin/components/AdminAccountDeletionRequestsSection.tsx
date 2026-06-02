"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { LocalPagination } from "@/components/ui/local-pagination";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatAccountDeletionStatus } from "@/lib/complianceLabels";
import { Textarea } from "@/components/ui/textarea";
import { CoachConfirmationDialog } from "@/features/coach/components/dialogs/CoachConfirmationDialog";
import { AdminAccountDeletionRequest } from "@/features/admin/adminApi";

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("fr-FR");
}

function getStatusVariant(status: AdminAccountDeletionRequest["status"]) {
  switch (status) {
    case "approved":
      return "secondary";
    case "rejected":
    case "cancelled":
      return "outline";
    case "completed":
      return "secondary";
    default:
      return "outline";
  }
}

type RequestFilter =
  | "active"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "all";

function matchesFilter(filter: RequestFilter, status: AdminAccountDeletionRequest["status"]) {
  if (filter === "all") return true;
  if (filter === "active") return status === "pending" || status === "approved";
  return status === filter;
}

function getFilterLabel(filter: RequestFilter) {
  switch (filter) {
    case "active":
      return "Actives";
    case "pending":
      return "En attente";
    case "approved":
      return "Approuvées";
    case "rejected":
      return "Refusées";
    case "completed":
      return "Supprimées";
    case "cancelled":
      return "Annulées";
    default:
      return "Toutes";
  }
}

type AdminAccountDeletionRequestsSectionProps = {
  requests: AdminAccountDeletionRequest[];
  isLoading: boolean;
  reviewingId: number | null;
  onRefresh: () => void;
  onRequestLegalHold: (user: AdminAccountDeletionRequest["user"]) => void;
  onReview: (input: {
    id: number;
    action: "approve" | "reject" | "complete";
    reviewNote?: string;
  }) => Promise<boolean>;
};

export function AdminAccountDeletionRequestsSection({
  requests,
  isLoading,
  reviewingId,
  onRefresh,
  onRequestLegalHold,
  onReview,
}: AdminAccountDeletionRequestsSectionProps) {
  const [noteById, setNoteById] = useState<Record<number, string>>({});
  const [completeTarget, setCompleteTarget] = useState<AdminAccountDeletionRequest | null>(null);
  const [filter, setFilter] = useState<RequestFilter>("active");
  const [page, setPage] = useState(1);

  const sortedRequests = useMemo(
    () => [...requests].sort((left, right) => left.requestedAt.localeCompare(right.requestedAt)).reverse(),
    [requests]
  );
  const filteredRequests = useMemo(
    () => sortedRequests.filter((request) => matchesFilter(filter, request.status)),
    [filter, sortedRequests]
  );
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleRequests = useMemo(
    () => filteredRequests.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRequests, safePage]
  );
  const filterCounts = useMemo(
    () => ({
      active: sortedRequests.filter((request) => matchesFilter("active", request.status)).length,
      pending: sortedRequests.filter((request) => request.status === "pending").length,
      approved: sortedRequests.filter((request) => request.status === "approved").length,
      rejected: sortedRequests.filter((request) => request.status === "rejected").length,
      completed: sortedRequests.filter((request) => request.status === "completed").length,
      cancelled: sortedRequests.filter((request) => request.status === "cancelled").length,
      all: sortedRequests.length,
    }),
    [sortedRequests]
  );

  const getNote = (id: number) => noteById[id] ?? "";

  return (
    <Card className="gap-0 border-border/60 bg-card py-0">
      <CardHeader className="border-b border-border/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">Demandes de suppression</CardTitle>
            <CardDescription>
              Revue manuelle des demandes RGPD avant suppression effective d&apos;un compte.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onRefresh}>
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-5">
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            Chargement des demandes de suppression...
          </div>
        ) : sortedRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            Aucune demande de suppression pour l&apos;instant.
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Filtre actif: <span className="font-medium text-foreground">{getFilterLabel(filter)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {filteredRequests.length} demande{filteredRequests.length > 1 ? "s" : ""} affichée
                  {filteredRequests.length > 1 ? "s" : ""}
                </div>
              </div>
              <ToggleGroup
                type="single"
                value={filter}
                onValueChange={(value) => {
                  if (value) {
                    setFilter(value as RequestFilter);
                    setPage(1);
                  }
                }}
                className="flex flex-wrap justify-start gap-2"
              >
                {(
                  [
                    "active",
                    "pending",
                    "approved",
                    "rejected",
                    "completed",
                    "cancelled",
                    "all",
                  ] as RequestFilter[]
                ).map((option) => (
                  <ToggleGroupItem key={option} value={option} size="sm" className="rounded-full px-3">
                    {getFilterLabel(option)} ({filterCounts[option]})
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Aucune demande ne correspond au filtre sélectionné.
              </div>
            ) : null}

            {visibleRequests.map((request) => {
              const isPending = reviewingId === request.id;
              const note = getNote(request.id);
              const canApproveOrReject = request.status === "pending";
              const canComplete = request.status === "approved";
              const noteError = note.length > 2000 ? "Note trop longue." : null;

              return (
                <div
                  key={request.id}
                  className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusVariant(request.status)}>
                          {formatAccountDeletionStatus(request.status)}
                        </Badge>
                        <Badge variant="outline">
                          <UserRound data-icon="inline-start" />
                          {request.user.firstName} {request.user.lastName}
                        </Badge>
                        <Badge variant="outline">{request.user.role}</Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <p>{request.user.email}</p>
                        <p>Demandée le {formatDateTime(request.requestedAt)}</p>
                        {request.reviewedAt ? <p>Revue le {formatDateTime(request.reviewedAt)}</p> : null}
                        {request.completedAt ? <p>Supprimée le {formatDateTime(request.completedAt)}</p> : null}
                        {request.cancelledAt ? <p>Annulée le {formatDateTime(request.cancelledAt)}</p> : null}
                        {request.reason ? <p>Motif: {request.reason}</p> : null}
                        {request.reviewNote ? <p>Note revue: {request.reviewNote}</p> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onRequestLegalHold(request.user)}
                      >
                        <ShieldAlert data-icon="inline-start" />
                        Legal hold
                      </Button>
                      {canApproveOrReject ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending || Boolean(noteError)}
                            onClick={() => void onReview({ id: request.id, action: "approve", reviewNote: note })}
                          >
                            Approuver
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending || Boolean(noteError)}
                            onClick={() => void onReview({ id: request.id, action: "reject", reviewNote: note })}
                          >
                            Refuser
                          </Button>
                        </>
                      ) : null}
                      {canComplete ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isPending || Boolean(noteError)}
                          onClick={() => setCompleteTarget(request)}
                        >
                          <ShieldAlert data-icon="inline-start" />
                          Finaliser
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <FieldGroup className="gap-3">
                    <Field data-invalid={noteError ? "true" : undefined}>
                      <FieldLabel htmlFor={`deletion-review-note-${request.id}`}>Note de revue</FieldLabel>
                      <Textarea
                        id={`deletion-review-note-${request.id}`}
                        placeholder="Note interne facultative sur la décision."
                        value={note}
                        aria-invalid={noteError ? "true" : "false"}
                        onChange={(event) =>
                          setNoteById((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                      />
                      {noteError ? <FieldError>{noteError}</FieldError> : null}
                    </Field>
                  </FieldGroup>
                </div>
              );
            })}

            {filteredRequests.length > 0 ? (
              <LocalPagination
                currentPage={safePage}
                pageCount={pageCount}
                totalCount={filteredRequests.length}
                pageSize={pageSize}
                itemLabel="demandes"
                compact
                onPageChange={setPage}
              />
            ) : null}
          </div>
        )}
      </CardContent>

      <CoachConfirmationDialog
        open={Boolean(completeTarget)}
        title="Finaliser la suppression du compte"
        description={
          completeTarget
            ? `Le compte de ${completeTarget.user.firstName} ${completeTarget.user.lastName} sera supprimé définitivement si aucun legal hold actif ne bloque l'opération.`
            : "Confirmez la suppression du compte."
        }
        confirmLabel="Supprimer définitivement"
        isPending={Boolean(completeTarget && reviewingId === completeTarget.id)}
        onOpenChange={(open) => {
          if (!open) {
            setCompleteTarget(null);
          }
        }}
        onConfirm={() => {
          if (!completeTarget) {
            return;
          }

          void onReview({
            id: completeTarget.id,
            action: "complete",
            reviewNote: getNote(completeTarget.id),
          }).then((success) => {
            if (success) {
              setCompleteTarget(null);
            }
          });
        }}
      />
    </Card>
  );
}
