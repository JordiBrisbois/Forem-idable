"use client";

import { ApiKeySummary } from "@/types/externalApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CoachApiKeysTarget } from "@/features/coach/types";
import { formatCoachDate } from "@/features/coach/utils";

interface CoachApiKeysDialogProps {
  apiKeysTarget: CoachApiKeysTarget | null;
  apiKeys: ApiKeySummary[];
  apiKeysFeedback: string | null;
  isApiKeysLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestRevokeApiKey: (key: ApiKeySummary) => void;
}

export function CoachApiKeysDialog({
  apiKeysTarget,
  apiKeys,
  apiKeysFeedback,
  isApiKeysLoading,
  onOpenChange,
  onRequestRevokeApiKey,
}: CoachApiKeysDialogProps) {
  return (
    <Dialog open={Boolean(apiKeysTarget)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Clés API</DialogTitle>
          <DialogDescription>
            {apiKeysTarget
              ? `Clés API de ${apiKeysTarget.email}. Les clés ne sont jamais affichées en clair.`
              : "Clés API de l'utilisateur."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {apiKeysFeedback ? <p className="text-sm text-muted-foreground">{apiKeysFeedback}</p> : null}
          {isApiKeysLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des clés API...</p>
          ) : apiKeys.length > 0 ? (
            apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="rounded-xl border bg-muted/20 p-4">
                <p className="font-medium">{apiKey.name}</p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {apiKey.keyPrefix}...{apiKey.lastFour}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Créée: {formatCoachDate(apiKey.createdAt, true)} •{" "}
                  {apiKey.expiresAt
                    ? `Expire: ${formatCoachDate(apiKey.expiresAt, true)}`
                    : "Sans expiration"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Dernier usage: {apiKey.lastUsedAt ? formatCoachDate(apiKey.lastUsedAt, true) : "Jamais"}
                </p>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onRequestRevokeApiKey(apiKey)}
                  >
                    Révoquer
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucune clé API active pour cet utilisateur.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
