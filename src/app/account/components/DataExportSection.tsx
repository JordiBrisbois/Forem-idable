import { Download, FileArchive } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDataExportStatus } from "@/lib/complianceLabels";
import { DataExportRequestSummary } from "../account.schemas";
import { formatDateTime } from "../account.utils";

type DataExportSectionProps = {
  requests: DataExportRequestSummary[];
  isLoading: boolean;
  isExporting: boolean;
  onCreate: () => Promise<void>;
  onDownload: (requestId: number) => void;
};

export function DataExportSection({
  requests,
  isLoading,
  isExporting,
  onCreate,
  onDownload,
}: DataExportSectionProps) {
  const latestCompleted = requests.find((entry) => entry.status === "completed");
  const pendingRequest = requests.find((entry) => entry.status === "pending");
  const failedRequest = requests.find((entry) => entry.status === "failed");

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileArchive data-icon="inline-start" className="text-primary" />
          Mes données
        </CardTitle>
        <CardDescription>
          Générez un export JSON de vos données principales: profil, candidatures, notes visibles,
          messages, historique et métadonnées associées.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            L&apos;export reste disponible pendant 7 jours puis est purgé automatiquement.
          </p>
          <Button type="button" variant="outline" disabled={isExporting} onClick={() => void onCreate()}>
            Générer un export
          </Button>
        </div>

        {pendingRequest ? (
          <Alert>
            <AlertTitle>Export en cours</AlertTitle>
            <AlertDescription>
              Une génération a été lancée le {formatDateTime(pendingRequest.createdAt)}.
            </AlertDescription>
          </Alert>
        ) : null}

        {failedRequest?.error ? (
          <Alert>
            <AlertTitle>Dernier export échoué</AlertTitle>
            <AlertDescription>{failedRequest.error}</AlertDescription>
          </Alert>
        ) : null}

        {latestCompleted ? (
          <Card className="shadow-none">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Dernier export disponible</CardTitle>
              <CardDescription>
                Généré le {formatDateTime(latestCompleted.createdAt)}
                {latestCompleted.expiresAt
                  ? ` • Expire le ${formatDateTime(latestCompleted.expiresAt)}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button type="button" onClick={() => onDownload(latestCompleted.id)}>
                <Download data-icon="inline-start" />
                Télécharger l&apos;export
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Separator />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Historique récent</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des exports…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun export demandé pour l&apos;instant.</p>
          ) : (
            requests.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 rounded-xl border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{formatDataExportStatus(entry.status)}</p>
                  <p className="text-xs text-muted-foreground">
                    Créé le {formatDateTime(entry.createdAt)}
                    {entry.completedAt ? ` • Terminé le ${formatDateTime(entry.completedAt)}` : ""}
                  </p>
                  {entry.expiresAt ? (
                    <p className="text-xs text-muted-foreground">
                      Expire le {formatDateTime(entry.expiresAt)}
                    </p>
                  ) : null}
                </div>
                {entry.status === "completed" ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => onDownload(entry.id)}>
                    <Download data-icon="inline-start" />
                    Télécharger
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
