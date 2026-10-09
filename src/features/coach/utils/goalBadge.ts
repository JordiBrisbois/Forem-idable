import { normalizeContractType } from "@/lib/contractType";
import { JobApplication } from "@/types/application";
import { SearchGoal } from "@/types/preferences";

export function isStageContract(contractType: string): boolean {
  return normalizeContractType(contractType) === "STAGE";
}

export function hasAcceptedStage(applications: JobApplication[]): boolean {
  return applications.some(
    (a) => a.status === "accepted" && isStageContract(a.job.contractType)
  );
}

export function hasAcceptedJob(applications: JobApplication[]): boolean {
  return applications.some(
    (a) => a.status === "accepted" && !isStageContract(a.job.contractType)
  );
}

export type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "outline"
  | "destructive"
  | "error"
  | "info"
  | "warning";

export interface ComputedGoalBadge {
  label: string;
  variant: BadgeVariant;
}

export function getSummaryBadgeVariant(tone: "accepted" | "rejected" | "interview") {
  if (tone === "rejected") return "error";
  if (tone === "accepted") return "success";
  return "info";
}

export function getGoalLabel(goal: SearchGoal): string {
  return goal === "internship" ? "Stage" : "Emploi";
}

export function getComputedGoalBadge(
  goal: SearchGoal,
  hasAcceptedStage: boolean,
  hasAcceptedJob: boolean
): ComputedGoalBadge {
  if (goal === "internship") {
    if (hasAcceptedJob) {
      return { label: "Emploi trouvé", variant: "success" };
    }
    if (hasAcceptedStage) {
      return { label: "Stage trouvé", variant: "success" };
    }
    return { label: "Recherche stage", variant: "info" };
  }

  if (hasAcceptedJob) {
    return { label: "Emploi trouvé", variant: "success" };
  }
  return { label: "Recherche emploi", variant: "secondary" };
}
