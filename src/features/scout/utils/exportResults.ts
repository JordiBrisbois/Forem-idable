import type { SheetData } from "write-excel-file/universal";

import type { ScoutResult } from "../scoutSchemas";

/**
 * Columns exported from the scout results table, in display order.
 *
 * The accessor returns the raw value; `null`/`undefined` are rendered as an
 * empty cell so a missing phone number never becomes the literal "null".
 */
export const SCOUT_EXPORT_COLUMNS = [
  { header: "Nom", value: (result: ScoutResult) => result.name },
  { header: "Type", value: (result: ScoutResult) => result.type },
  { header: "Email", value: (result: ScoutResult) => result.email },
  { header: "Téléphone", value: (result: ScoutResult) => result.phone },
  { header: "Site web", value: (result: ScoutResult) => result.website },
  { header: "Adresse", value: (result: ScoutResult) => result.address },
  { header: "Ville", value: (result: ScoutResult) => result.town },
  { header: "Source email", value: (result: ScoutResult) => result.emailSource },
] as const;

export type ScoutExportFormat = "excel" | "csv";

/** Header row followed by one row per result, as plain strings. */
export function buildScoutExportRows(results: readonly ScoutResult[]): string[][] {
  const header = SCOUT_EXPORT_COLUMNS.map((column) => column.header);
  const body = results.map((result) =>
    SCOUT_EXPORT_COLUMNS.map((column) => column.value(result) ?? ""),
  );
  return [header, ...body];
}

/**
 * Serialises rows as delimited text.
 *
 * Cells are quoted only when they contain the delimiter, a double quote or a
 * line break, which is what spreadsheet software expects from a quoted CSV.
 */
export function toDelimitedText(rows: readonly (readonly string[])[], delimiter = ";"): string {
  return rows
    .map((row) => row.map((cell) => quoteCell(cell, delimiter)).join(delimiter))
    .join("\n");
}

function quoteCell(value: string, delimiter: string): string {
  const needsQuotes =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r");

  return needsQuotes ? `"${value.replaceAll('"', '""')}"` : value;
}

/** `scout-resultats-2026-10-29.xlsx` — ISO date so exports sort naturally. */
export function scoutExportFileName(
  format: ScoutExportFormat,
  date: Date = new Date(),
): string {
  const day = date.toISOString().slice(0, 10);
  return `scout-resultats-${day}.${format === "excel" ? "xlsx" : "csv"}`;
}

/**
 * Builds the export in the browser and hands it to the user.
 *
 * `write-excel-file` is imported dynamically so the XLSX writer never enters
 * the server bundle nor the initial page payload: the export is a rare action.
 */
export async function downloadScoutResults(
  results: readonly ScoutResult[],
  format: ScoutExportFormat,
): Promise<void> {
  const rows = buildScoutExportRows(results);

  if (format === "csv") {
    // The BOM makes Excel interpret the file as UTF-8 (accents in town names).
    const csv = `\uFEFF${toDelimitedText(rows)}`;
    triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), scoutExportFileName("csv"));
    return;
  }

  const { default: writeXlsxFile } = await import("write-excel-file/universal");
  const sheet: SheetData = rows.map((row, rowIndex) =>
    rowIndex === 0
      ? row.map((value) => ({ value, fontWeight: "bold" as const }))
      : [...row],
  );
  const blob = await writeXlsxFile(sheet, { sheet: "Résultats" }).toBlob();
  triggerDownload(blob, scoutExportFileName("excel"));
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
