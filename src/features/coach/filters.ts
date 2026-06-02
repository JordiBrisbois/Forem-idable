import { CoachUserFilter } from "@/features/coach/types";

export const coachUserFilterOptions: Array<{
  value: CoachUserFilter;
  label: string;
}> = [
  { value: "all", label: "Tous" },
  { value: "urgent", label: "Urgents" },
  { value: "due", label: "A relancer" },
  { value: "interviews", label: "Entretiens" },
  { value: "inactive", label: "Inactifs" },
  { value: "accepted", label: "Acceptées" },
  { value: "rejected", label: "Refusées" },
];

export type CoachRecentActivityFilter = "all" | "interviews";

export const coachRecentActivityFilterOptions: Array<{
  value: CoachRecentActivityFilter;
  label: string;
}> = [
  { value: "all", label: "Tout" },
  { value: "interviews", label: "Entretiens" },
];
