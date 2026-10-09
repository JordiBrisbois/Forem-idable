import { post, patch, put, del } from "@/lib/api/client";
import { SearchGoal } from "@/types/preferences";
import { BeneficiaryStage } from "@/types/beneficiaryStage";

export function createCoachGroup(name: string) {
  return post<{ group?: { id: number }; error?: string }>("/api/coach/groups", { name });
}

export function addCoachGroupMember(groupId: number, userId: number) {
  return post<Record<string, never>>(`/api/coach/groups/${groupId}/members`, { userId });
}

export function addCoachGroupCoach(groupId: number, userId: number) {
  return post<Record<string, never>>(`/api/coach/groups/${groupId}/coaches`, { userId });
}

export function setCoachGroupManager(groupId: number, userId: number) {
  return put<Record<string, never>>(`/api/coach/groups/${groupId}/manager`, { userId });
}

export function removeCoachGroupMember(groupId: number, userId: number) {
  return del<Record<string, never>>(`/api/coach/groups/${groupId}/members?userId=${userId}`);
}

export function removeCoachGroupCoach(groupId: number, userId: number) {
  return del<{ error?: string }>(`/api/coach/groups/${groupId}/coaches?userId=${userId}`);
}

export function deleteCoachGroup(groupId: number) {
  return del<{ error?: string }>(`/api/coach/groups?groupId=${groupId}`);
}

export function updateCoachUserGoal(userId: number, goal: SearchGoal, reason?: string) {
  return patch<{ ok?: boolean }>(`/api/coach/users/${userId}/goal`, { goal, reason });
}

export function updateCoachUserStage(userId: number, stage: BeneficiaryStage, reason?: string) {
  return patch<{ ok?: boolean }>(`/api/coach/users/${userId}/stage`, { stage, reason });
}

export function archiveCoachGroup(groupId: number, archived: boolean) {
  return patch<Record<string, never>>(`/api/coach/groups/${groupId}/archive`, { archived });
}
