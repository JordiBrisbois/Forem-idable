import { z } from "zod";

/** Some ODWB fields are arrays in the live dataset but scalars in old exports. */
const stringList = z.union([z.array(z.string()), z.string()]).nullish();

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
    // Arrays in the live dataset ("Belgique", "Province du Hainaut", "RÉGION
    // WALLONNE"). Typing this as a string made every page fail validation, so
    // the sync never stored anything and reported a shape error instead.
    lieuxtravailregion: stringList,
    typecontrat: z.string().nullish(),
    datedebutdiffusion: z.string().nullish(),
    url: z.string().nullish(),
    metier: z.string().nullish(),
    referenceexterne: z.string().nullish(),
    regimetravail: z.string().nullish(),
    experiencerequise: z.string().nullish(),
    permisdeconduire: stringList,
    datefindiffusion: z.string().nullish(),
    langues: stringList,
    niveauxetudes: stringList,
    secteurs: stringList,
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
