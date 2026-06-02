import { z } from "zod";

export const scoutJobCreateSchema = z.object({
  query: z.string().min(1, "Ville requise").max(200),
  radius: z.number().int().min(500).max(20000).default(5000),
  categories: z.array(z.string()).optional(),
  scrapeEmails: z.boolean().optional(),
});

export type ScoutJobCreateInput = z.infer<typeof scoutJobCreateSchema>;

export interface ScoutJob {
  id: number;
  status: "queued" | "pending" | "running" | "completed" | "failed";
  query: string;
  lat: string;
  lon: string;
  radius: number;
  categories: string[];
  scrapeEmails: boolean;
  totalSteps: number;
  completedSteps: number;
  resultCount: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ScoutResult {
  id: number;
  name: string;
  type: string;
  email: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  lat: string | null;
  lon: string | null;
  town: string | null;
  emailSource: string;
  allEmails: string[];
  osmId: number | null;
}

export interface ScoutProgressEvent {
  type: "progress" | "completed" | "error";
  step?: number;
  total?: number;
  found?: number;
  message?: string;
  resultCount?: number;
}
