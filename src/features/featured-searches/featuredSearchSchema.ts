import { z } from "zod";

const locationTypeSchema = z.enum([
  "Pays",
  "Régions",
  "Provinces",
  "Arrondissements",
  "Communes",
  "Localités",
]);

const locationEntrySchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: locationTypeSchema,
  code: z.string().trim().min(1).optional(),
  level: z.number().int().optional(),
  postalCode: z.string().trim().min(1).optional(),
  parentId: z.string().trim().min(1).optional(),
});

export const featuredSearchQuerySchema = z
  .object({
    keywords: z.array(z.string().trim().min(1).max(80)).max(12),
    locations: z.array(locationEntrySchema).max(8),
    booleanMode: z.enum(["AND", "OR"]),
  })
  .superRefine((value, context) => {
    if (value.keywords.length === 0 && value.locations.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ajoutez au moins un mot-clé ou un lieu.",
        path: ["keywords"],
      });
    }
  });

export const featuredSearchPayloadSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court.").max(120, "Titre trop long."),
  message: z.string().trim().min(8, "Message trop court.").max(500, "Message trop long."),
  ctaLabel: z.string().trim().min(2, "Label du bouton trop court.").max(40, "Label du bouton trop long."),
  query: featuredSearchQuerySchema,
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export type FeaturedSearchPayload = z.infer<typeof featuredSearchPayloadSchema>;

export function parseKeywordInput(input: string) {
  return input
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
