import { Job } from "@/types/job";
import { SearchQuery } from "@/types/search";

export type ExportTarget = "all" | "selected";

export function getExportScopeJobs(
  target: ExportTarget,
  jobs: Job[],
  selectedJobs: Job[]
): Job[] {
  return target === "selected" ? selectedJobs : jobs;
}

export function buildExportMetadata(options: {
  target: ExportTarget;
  jobsCount: number;
  searchQuery: SearchQuery | null;
  now?: Date;
}): Record<string, string> {
  const now = options.now || new Date();
  return {
    "Export généré le": now.toLocaleString("fr-BE"),
    "Mots-clés":
      options.searchQuery?.keywords.join(
        ` ${options.searchQuery?.booleanMode || "OU"} `
      ) || "Aucun",
    "Lieux":
      options.searchQuery?.locations.map((loc) => loc.name).join(" | ") || "Tous",
    "Mode booléen":
      options.searchQuery?.booleanMode === "AND" ? "ET" : "OU",
    "Nombre d'offres": String(options.jobsCount),
    "Portée export":
      options.target === "selected" ? "Sélection" : "Tous les résultats",
  };
}
