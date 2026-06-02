import { ExportColumnKey } from "@/lib/exportCsv";

export const EXPORTABLE_COLUMNS: { key: ExportColumnKey; label: string }[] = [
  { key: "title", label: "Titre" },
  { key: "company", label: "Entreprise" },
  { key: "location", label: "Lieu" },
  { key: "contractType", label: "Contrat" },
  { key: "publicationDate", label: "Date de publication" },
  { key: "source", label: "Source" },
  { key: "url", label: "Lien" },
  { key: "description", label: "Description (aperçu)" },
];

