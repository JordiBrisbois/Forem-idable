import { z } from "zod";
import { SearchGoal } from "@/types/preferences";

export const beneficiaryStageSchema = z.enum([
  "internship_search",
  "internship_ongoing",
  "job_search",
  "employed",
  "exited",
]);

export type BeneficiaryStage = z.infer<typeof beneficiaryStageSchema>;

export const BENEFICIARY_STAGE_LABELS: Record<BeneficiaryStage, string> = {
  internship_search: "Recherche stage",
  internship_ongoing: "En stage",
  job_search: "Recherche emploi",
  employed: "En emploi",
  exited: "Sortie",
};

export const BENEFICIARY_STAGE_ORDER: BeneficiaryStage[] = [
  "internship_search",
  "internship_ongoing",
  "job_search",
  "employed",
  "exited",
];

/** The search goal that makes sense for a given parcours step. */
export function stageToSearchGoal(stage: BeneficiaryStage): SearchGoal {
  return stage === "job_search" || stage === "employed" ? "job" : "internship";
}
