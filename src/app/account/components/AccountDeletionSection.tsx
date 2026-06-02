"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatAccountDeletionStatus } from "@/lib/complianceLabels";
import { AccountDeletionRequestSummary } from "../account.schemas";
import { formatDateTime } from "../account.utils";

type AccountDeletionSectionProps = {
  requests: AccountDeletionRequestSummary[];
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmit: (reason: string) => Promise<void>;
  onCancel: () => Promise<void>;
};

export function AccountDeletionSection({
  requests,
  isLoading,
  isSubmitting,
  onSubmit,
  onCancel,
}: AccountDeletionSectionProps) {
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const pendingRequest = useMemo(
    () => requests.find((entry) => entry.status === "pending"),
    [requests]
  );
  const canConfirmDeletion = confirmation.trim().toUpperCase() === "SUPPRIMER";

  return (
    <Card className="overflow-hidden border-destructive/30 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShieldAlert data-icon="inline-start" className="text-destructive" />
          Suppression du compte
        </CardTitle>
        <CardDescription>
          Demande une suppression manuelle contrôlée. En cas de conservation légale ou de litige,
          certaines données peuvent être temporairement gelées.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {pendingRequest ? (
          <>
            <Alert>
              <AlertTitle>Demande en attente</AlertTitle>
              <AlertDescription>
                Demandée le {formatDateTime(pendingRequest.requestedAt)}
                {pendingRequest.reason ? ` • Motif: ${pendingRequest.reason}` : ""}
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => void onCancel()}>
                Annuler la demande
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-3">
              <label className="text-sm font-medium text-foreground" htmlFor="account-deletion-reason">
                Motif facultatif
              </label>
              <Textarea
                id="account-deletion-reason"
                placeholder="Expliquez brièvement votre demande si utile."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={2000}
              />
              <label className="text-sm font-medium text-foreground" htmlFor="account-deletion-confirmation">
                Tapez SUPPRIMER pour confirmer
              </label>
              <input
                id="account-deletion-confirmation"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                placeholder="SUPPRIMER"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={!canConfirmDeletion || isSubmitting}>
                  <Trash2 data-icon="inline-start" />
                  Demander la suppression
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la demande de suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette demande n&apos;efface pas immédiatement le compte. Elle déclenche une revue
                    manuelle et peut être bloquée par une conservation légale.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={!canConfirmDeletion || isSubmitting}
                    onClick={() => void onSubmit(reason)}
                  >
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Historique récent</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des demandes…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande enregistrée.</p>
          ) : (
            requests.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border bg-background px-4 py-3 text-sm text-muted-foreground"
              >
                <p className="font-medium text-foreground">
                  {formatAccountDeletionStatus(entry.status)}
                </p>
                <p>Demandée le {formatDateTime(entry.requestedAt)}</p>
                {entry.reason ? <p>Motif: {entry.reason}</p> : null}
                {entry.reviewNote ? <p>Revue: {entry.reviewNote}</p> : null}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
