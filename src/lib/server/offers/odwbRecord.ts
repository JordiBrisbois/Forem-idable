import { z } from "zod";

/**
 * The subset of the ODWB "offres-d-emploi-forem" record we rely on. The record
 * is passed through: the dataset gains fields over time and the detail view
 * renders whatever the payload carries.
 */
export const odwbOfferRecordSchema = z
  .object({
    numerooffreforem: z.union([z.string(), z.number()]).nullish(),
    titreoffre: z.string().nullish(),
    nomemployeur: z.string().nullish(),
    lieuxtravaillocalite: z.array(z.string()).nullish(),
    lieuxtravailcodepostal: z.array(z.string()).nullish(),
    lieuxtravailregion: z.string().nullish(),
    typecontrat: z.string().nullish(),
    datedebutdiffusion: z.string().nullish(),
    url: z.string().nullish(),
    metier: z.string().nullish(),
    referenceexterne: z.string().nullish(),
    regimetravail: z.string().nullish(),
    experiencerequise: z.string().nullish(),
    permisdeconduire: z.string().nullish(),
    datefindiffusion: z.string().nullish(),
    langues: z.union([z.array(z.string()), z.string()]).nullish(),
    niveauxetudes: z.union([z.array(z.string()), z.string()]).nullish(),
    secteurs: z.union([z.array(z.string()), z.string()]).nullish(),
    nombrepostes: z.union([z.number(), z.string()]).nullish(),
  })
  .passthrough();

export type OdwbOfferRecord = z.infer<typeof odwbOfferRecordSchema>;

export const odwbRecordsResponseSchema = z
  .object({
    results: z.array(odwbOfferRecordSchema).default([]),
    total_count: z.number().optional(),
  })
  .passthrough();

export type OdwbRecordsResponse = z.infer<typeof odwbRecordsResponseSchema>;
