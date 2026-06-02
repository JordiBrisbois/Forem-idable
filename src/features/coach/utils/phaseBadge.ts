import { normalizeContractType } from "@/lib/contractType";
import { JobApplication } from "@/types/application";
import { TrackingPhase } from "@/types/coach";

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

export interface ComputedPhaseBadge {
  label: string;
  variant: "default" | "secondary" | "success" | "outline" | "destructive" | "error" | "info" | "warning";
}

export function getSummaryBadgeVariant(tone: "accepted" | "rejected" | "interview") {
  if (tone === "rejected") return "error";
  if (tone === "accepted") return "success";
  return "info";
}

export function getComputedPhaseBadge(
  trackingPhase: TrackingPhase,
  hasAcceptedStage: boolean,
  hasAcceptedJob: boolean
): ComputedPhaseBadge {
  if (trackingPhase === "placed") {
    return { label: "En emploi", variant: "outline" };
  }

  if (trackingPhase === "dropped") {
    return { label: "Sortie du dispositif", variant: "error" };
  }

  if (trackingPhase === "internship_search") {
    if (hasAcceptedJob) {
      return { label: "Sortie positive", variant: "success" };
    }
    if (hasAcceptedStage) {
      return { label: "Recherche stage", variant: "success" };
    }
    return { label: "Recherche stage", variant: "info" };
  }

  if (trackingPhase === "job_search") {
    if (hasAcceptedJob) {
      return { label: "Sortie positive", variant: "success" };
    }
    return { label: "Recherche emploi", variant: "secondary" };
  }

  return { label: trackingPhase, variant: "outline" };
}
