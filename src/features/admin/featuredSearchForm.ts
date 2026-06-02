"use client";

import { z } from "zod";
import {
  FeaturedSearchPayload,
  featuredSearchPayloadSchema,
  parseKeywordInput,
} from "@/features/featured-searches/featuredSearchSchema";
import { FeaturedSearch } from "@/types/featuredSearch";

export const featuredSearchFormSchema = z
  .object({
    title: z.string().trim().min(3, "Titre trop court.").max(120, "Titre trop long."),
    message: z.string().trim().min(8, "Message trop court.").max(500, "Message trop long."),
    ctaLabel: z
      .string()
      .trim()
      .min(2, "Label du bouton trop court.")
      .max(40, "Label du bouton trop long."),
    keywordsInput: z.string(),
    booleanMode: z.enum(["AND", "OR"]),
    isActive: z.boolean(),
    sortOrder: z
      .string()
      .trim()
      .min(1, "Ordre requis.")
      .refine((value) => /^\d+$/.test(value), "Ordre invalide.")
      .refine((value) => Number.parseInt(value, 10) <= 999, "Ordre invalide."),
  })
  .superRefine((value, ctx) => {
    const parsed = featuredSearchPayloadSchema.safeParse({
      title: value.title,
      message: value.message,
      ctaLabel: value.ctaLabel,
      query: {
        keywords: parseKeywordInput(value.keywordsInput),
        locations: [],
        booleanMode: value.booleanMode,
      },
      isActive: value.isActive,
      sortOrder: Number.parseInt(value.sortOrder, 10),
    });

    if (parsed.success) {
      return;
    }

    for (const issue of parsed.error.issues) {
      const [firstPath] = issue.path;
      if (firstPath === "query") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["keywordsInput"],
          message: issue.message,
        });
      }
    }
  });

export type FeaturedSearchFormValues = z.infer<typeof featuredSearchFormSchema>;

const DEFAULT_FEATURED_SEARCH_FORM_VALUES: FeaturedSearchFormValues = {
  title: "",
  message: "",
  ctaLabel: "Consulter les offres",
  keywordsInput: "",
  booleanMode: "OR",
  isActive: true,
  sortOrder: "0",
};

export function createFeaturedSearchFormValues(): FeaturedSearchFormValues {
  return { ...DEFAULT_FEATURED_SEARCH_FORM_VALUES };
}

export function toFeaturedSearchFormValues(item: FeaturedSearch): FeaturedSearchFormValues {
  return {
    title: item.title,
    message: item.message,
    ctaLabel: item.ctaLabel,
    keywordsInput: item.query.keywords.join(", "),
    booleanMode: item.query.booleanMode,
    isActive: item.isActive,
    sortOrder: String(item.sortOrder),
  };
}

export function toFeaturedSearchPayload(
  values: FeaturedSearchFormValues
): FeaturedSearchPayload {
  return {
    title: values.title.trim(),
    message: values.message.trim(),
    ctaLabel: values.ctaLabel.trim(),
    query: {
      keywords: parseKeywordInput(values.keywordsInput),
      locations: [],
      booleanMode: values.booleanMode,
    },
    isActive: values.isActive,
    sortOrder: Number.parseInt(values.sortOrder, 10),
  };
}
