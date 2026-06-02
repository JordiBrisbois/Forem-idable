import type {
  AccountDeletionRequestStatus,
  DataExportRequestStatus,
} from "@/lib/server/compliance";

export function formatDataExportStatus(status: DataExportRequestStatus) {
  switch (status) {
    case "completed":
      return "Terminé";
    case "failed":
      return "Échoué";
    default:
      return "En cours";
  }
}

export function formatAccountDeletionStatus(status: AccountDeletionRequestStatus) {
  switch (status) {
    case "approved":
      return "Approuvée";
    case "rejected":
      return "Refusée";
    case "completed":
      return "Supprimée";
    case "cancelled":
      return "Annulée";
    default:
      return "En attente";
  }
}
