import { z } from "zod";

export const searchGoalSchema = z.enum(["internship", "job"]);

export type SearchGoal = z.infer<typeof searchGoalSchema>;

export const SEARCH_GOAL_LABELS: Record<SearchGoal, string> = {
  internship: "Stage",
  job: "Emploi",
};

export function isSearchGoal(value: unknown): value is SearchGoal {
  return searchGoalSchema.safeParse(value).success;
}
