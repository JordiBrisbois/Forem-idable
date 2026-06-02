import { z } from "zod";
import { LocationEntry } from "@/services/location/locationCache";

export type BooleanMode = "AND" | "OR";

export interface SearchQuery {
  keywords: string[];
  locations: LocationEntry[];
  booleanMode: BooleanMode;
}

export const booleanModeSchema = z.enum(["AND", "OR"]);

export const locationEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum([
    "Pays",
    "Régions",
    "Provinces",
    "Arrondissements",
    "Communes",
    "Localités",
  ]),
  parentId: z.string().optional(),
  code: z.string().optional(),
  level: z.number().optional(),
  postalCode: z.string().optional(),
});

export const searchQuerySchema = z.object({
  keywords: z.array(z.string().trim().min(1)).max(20),
  locations: z.array(locationEntrySchema).max(10),
  booleanMode: booleanModeSchema,
});
