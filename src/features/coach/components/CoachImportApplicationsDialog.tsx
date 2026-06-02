"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { normalizeContractType } from "@/lib/contractType";
import { AlertCircleIcon, CheckCircle2Icon, Download, LoaderCircle, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COACH_IMPORT_FIELDS,
  CoachImportFieldKey,
  detectCoachImportFieldMapping,
  normalizeCoachImportedStatus,
} from "@/features/coach/importUtils";

const STATUS_OPTIONS = [
  { value: "in_progress", label: "En cours" },
  { value: "follow_up", label: "Relance à faire" },
  { value: "interview", label: "Entretien" },
  { value: "accepted", label: "Acceptée" },
  { value: "rejected", label: "Refusée" },
] as const;
type ImportDateFormat = "dmy" | "mdy";

type CsvRecord = Record<string, string>;

interface CoachImportApplicationsDialogProps {
  open: boolean;
  userLabel: string;
  isImporting: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    rows: Array<Record<CoachImportFieldKey, string>>,
    dateFormat: ImportDateFormat
  ) => Promise<{
    importedCount: number;
    createdCount: number;
    updatedCount: number;
    ignoredCount: number;
  } | null>;
}

export function CoachImportApplicationsDialog({
  open,
  userLabel,
  isImporting,
  onOpenChange,
  onImport,
}: CoachImportApplicationsDialogProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRecord[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<CoachImportFieldKey, string>>({
    company: "",
    contractType: "",
    title: "",
    location: "",
    appliedAt: "",
    status: "",
    notes: "",
  });
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [dateFormat, setDateFormat] = useState<ImportDateFormat>("dmy");
  const [summary, setSummary] = useState<{
    importedCount: number;
    createdCount: number;
    updatedCount: number;
    ignoredCount: number;
  } | null>(null);

  const hasRequiredMapping = mapping.company && mapping.title;

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);
  const duplicateCount = useMemo(() => {
    const seen = new Set<string>();
    let duplicates = 0;

    for (const row of rows) {
      const company = (row[mapping.company] ?? "").trim().toLowerCase();
      const title = (row[mapping.title] ?? "").trim().toLowerCase();
      const appliedAt = mapping.appliedAt ? (row[mapping.appliedAt] ?? "").trim().toLowerCase() : "";
      if (!company || !title) continue;

      const fingerprint = `${company}|${title}|${appliedAt}`;
      if (seen.has(fingerprint)) {
        duplicates += 1;
      } else {
        seen.add(fingerprint);
      }
    }

    return duplicates;
  }, [mapping.appliedAt, mapping.company, mapping.title, rows]);
  const unresolvedStatuses = useMemo(() => {
    if (!mapping.status) {
      return [];
    }

    const seen = new Set<string>();
    return rows
      .map((row) => (row[mapping.status] ?? "").trim())
      .filter((status) => {
        if (!status) return false;
        if (normalizeCoachImportedStatus(status)) return false;
        if (seen.has(status)) return false;
        seen.add(status);
        return true;
      });
  }, [mapping.status, rows]);

  const resetState = (preserveSummary = false) => {
    setHeaders([]);
    setRows([]);
    setFeedback(null);
    setMapping({
      company: "",
      contractType: "",
      title: "",
      location: "",
      appliedAt: "",
      status: "",
      notes: "",
    });
    setDateFormat("dmy");
    setStatusOverrides({});
    if (!preserveSummary) {
      setSummary(null);
    }
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse([
      {
        Entreprise: "TB IMMO",
        "Type de contrat": "Stage",
        "Intitulé de poste": "Collaboratrice administrative",
        Lieu: "Bruxelles",
        "Date d'envoi": "13-03-23",
        Statut: "En cours",
        Note: "",
      },
    ]);

    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modele-import-suivi.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setFeedback(null);

    const parsed = await new Promise<Papa.ParseResult<CsvRecord>>((resolve, reject) => {
      Papa.parse<CsvRecord>(file, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject,
      });
    }).catch(() => null);

    if (!parsed) {
      setFeedback("Impossible de lire ce fichier CSV.");
      return;
    }

    const nextHeaders = parsed.meta.fields ?? [];
    const cleanedRows = parsed.data.filter((row) =>
      Object.values(row).some((value) => (value ?? "").toString().trim() !== "")
    );

    if (nextHeaders.length === 0 || cleanedRows.length === 0) {
      setFeedback("Le fichier ne contient aucune ligne exploitable.");
      return;
    }

    setHeaders(nextHeaders);
    setRows(cleanedRows);
    setMapping(detectCoachImportFieldMapping(nextHeaders));
  };

  const handleImport = async () => {
    if (!hasRequiredMapping) {
      setFeedback("Les colonnes Entreprise et Intitulé de poste sont obligatoires.");
      return;
    }

    if (unresolvedStatuses.some((status) => !statusOverrides[status])) {
      setFeedback("Choisissez un vrai statut pour chaque valeur non reconnue avant l'import.");
      return;
    }

    const mappedRows = rows
      .map((row) => ({
        company: row[mapping.company] ?? "",
        contractType: mapping.contractType ? normalizeContractType(row[mapping.contractType]) : "",
        title: row[mapping.title] ?? "",
        location: mapping.location ? row[mapping.location] ?? "" : "",
        appliedAt: mapping.appliedAt ? row[mapping.appliedAt] ?? "" : "",
        status: mapping.status
          ? normalizeCoachImportedStatus(row[mapping.status] ?? "") ||
            statusOverrides[(row[mapping.status] ?? "").trim()] ||
            ""
          : "",
        notes: mapping.notes ? row[mapping.notes] ?? "" : "",
      }))
      .filter((row) => row.company.trim() && row.title.trim());

    if (mappedRows.length === 0) {
      setFeedback("Aucune ligne importable après mapping.");
      return;
    }

    const result = await onImport(mappedRows, dateFormat);
    if (result) {
      setSummary(result);
      resetState(true);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetState();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Importer un suivi (CSV)</DialogTitle>
          <DialogDescription>
            Importer un tableau CSV de candidatures pour {userLabel}. Les lignes seront créées comme
            candidatures manuelles.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/10 px-6 py-8 text-center">
              <Upload className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">Choisir un fichier CSV</span>
              <span className="text-xs text-muted-foreground">
                Un export Excel enregistré en CSV fonctionne très bien.
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <div className="flex justify-start">
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                <Download data-icon="inline-start" />
                Télécharger un modèle CSV
              </Button>
            </div>

            {headers.length > 0 ? (
              <label className="flex max-w-xs flex-col gap-2">
                <span className="text-sm font-medium">Format de date</span>
                <Select
                  value={dateFormat}
                  onValueChange={(value) => setDateFormat(value as ImportDateFormat)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir le format de date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="dmy">JJ-MM-AAAA / JJ/MM/AA</SelectItem>
                      <SelectItem value="mdy">MM-DD-YYYY / MM/DD/YY</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </label>
            ) : null}

            {headers.length > 0 ? (
              <Card className="gap-4 py-0">
                <CardHeader className="pt-5 pb-2">
                  <CardTitle>Associer les colonnes</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 pb-5 md:grid-cols-2">
                  {COACH_IMPORT_FIELDS.map((field) => (
                    <label key={field.key} className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {field.label}
                        {field.required ? " *" : ""}
                      </span>
                      <Select
                        value={mapping[field.key] || "__none__"}
                        onValueChange={(value) =>
                          setMapping((current) => ({
                            ...current,
                            [field.key]: value === "__none__" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Ne pas importer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="__none__">Ne pas importer</SelectItem>
                            {headers.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </label>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {unresolvedStatuses.length > 0 ? (
              <Alert>
                <AlertCircleIcon />
                <AlertTitle>Statuts à confirmer</AlertTitle>
                <AlertDescription className="gap-3">
                  <p>
                    Certaines valeurs de statut ne sont pas reconnues automatiquement. Choisis leur
                    équivalent avant l&apos;import.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {unresolvedStatuses.map((status) => (
                      <label key={status} className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-foreground">{status}</span>
                        <Select
                          value={statusOverrides[status] || "__unset__"}
                          onValueChange={(value) =>
                            setStatusOverrides((current) => ({
                              ...current,
                              [status]: value === "__unset__" ? "" : value,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choisir un statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="__unset__">Choisir un statut</SelectItem>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </label>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}

            {rows.length > 0 ? (
              <Alert>
                <AlertCircleIcon />
                <AlertTitle>Résumé du fichier</AlertTitle>
                <AlertDescription>
                  <p>
                    {rows.length} ligne{rows.length > 1 ? "s" : ""} détectée
                    {rows.length > 1 ? "s" : ""}.
                    {duplicateCount > 0
                      ? ` ${duplicateCount} doublon${duplicateCount > 1 ? "s" : ""} dans ce fichier CSV sera${duplicateCount > 1 ? "ont" : ""} ignoré${duplicateCount > 1 ? "s" : ""}.`
                      : " Aucun doublon dans ce fichier CSV."}
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}

            {previewRows.length > 0 ? (
              <Card className="gap-4 py-0">
                <CardHeader className="pt-5 pb-2">
                  <CardTitle>Aperçu ({rows.length} lignes détectées)</CardTitle>
                </CardHeader>
                <CardContent className="pb-5">
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          {headers.map((header) => (
                            <th key={header} className="border-b px-3 py-2 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, index) => (
                          <tr key={`${index}-${row[headers[0]] ?? "row"}`}>
                            {headers.map((header) => (
                              <td key={header} className="border-b px-3 py-2 align-top text-muted-foreground">
                                {row[header] ?? ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Empty className="min-h-48 border bg-muted/10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Upload />
                  </EmptyMedia>
                  <EmptyTitle>Aucun CSV chargé</EmptyTitle>
                  <EmptyDescription>
                    Ajoute un fichier pour voir l&apos;aperçu, détecter les doublons et préparer le mapping.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {summary ? (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Dernier import terminé</AlertTitle>
                <AlertDescription>
                  <p>
                    {summary.createdCount} créée{summary.createdCount > 1 ? "s" : ""} •{" "}
                    {summary.updatedCount} mise{summary.updatedCount > 1 ? "s" : ""} à jour •{" "}
                    {summary.ignoredCount} ignorée{summary.ignoredCount > 1 ? "s" : ""}.
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}

            {feedback ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Import impossible</AlertTitle>
                <AlertDescription>{feedback}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void handleImport()} disabled={!rows.length || isImporting}>
            {isImporting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Importer le suivi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
