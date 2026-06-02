import { runtimeConfig } from "@/config/runtime";
import { Job } from "@/types/job";
import { getJobExternalUrl } from "@/features/jobs/utils/jobLinks";
import { escapeCsvCell } from "@/lib/csv";

export type ExportColumnKey =
    | "title"
    | "company"
    | "location"
    | "contractType"
    | "publicationDate"
    | "source"
    | "url"
    | "description";

const EXPORT_COLUMNS: Record<ExportColumnKey, string> = {
    title: "Titre",
    company: "Entreprise",
    location: "Lieu",
    contractType: "Contrat",
    publicationDate: "Date de publication",
    source: "Source",
    url: "Lien",
    description: "Aperçu description",
};

interface ExportCsvOptions {
    filename?: string;
    columns?: ExportColumnKey[];
    metadata?: Record<string, string>;
}

export function exportJobsToCSV(jobs: Job[], options: ExportCsvOptions = {}) {
    if (!jobs || !jobs.length) return;
    const filename = options.filename || `offres-${runtimeConfig.app.exportFilenamePrefix}.csv`;
    const columns = options.columns && options.columns.length > 0
        ? options.columns
        : (Object.keys(EXPORT_COLUMNS) as ExportColumnKey[]);

    const headers = columns.map((column) => EXPORT_COLUMNS[column]);

    const valueByColumn = (job: Job, column: ExportColumnKey): string => {
        switch (column) {
            case "title":
                return job.title;
            case "company":
                return job.company || "";
            case "location":
                return job.location;
            case "contractType":
                return job.contractType;
            case "publicationDate":
                return job.publicationDate;
            case "source":
                return job.source;
            case "url":
                return getJobExternalUrl(job);
            case "description":
                return job.description ? `${job.description.substring(0, 150)}...` : "";
            default:
                return "";
        }
    };

    const rows = jobs.map((job) => {
        return columns.map((column) => escapeCsvCell(valueByColumn(job, column))).join(",");
    });

    const metadataRows = Object.entries(options.metadata || {}).map(([label, value]) =>
        `${escapeCsvCell(label)},${escapeCsvCell(value)}`
    );
    const preamble = metadataRows.length > 0 ? [...metadataRows, ""] : [];
    const csvContent = [...preamble, headers.join(","), ...rows].join("\n");

    // Create Blob and trigger download
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
