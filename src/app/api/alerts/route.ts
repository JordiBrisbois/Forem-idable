import { NextResponse } from "next/server";
import { z } from "zod";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { contractTypeSchema } from "@/lib/contractType";
import { createJobAlert, listJobAlerts } from "@/lib/server/alerts/repository";

function publicAlert(alert: Awaited<ReturnType<typeof createJobAlert>>) {
  return {
    id: alert.id,
    name: alert.name,
    keywords: alert.keywords,
    booleanMode: alert.booleanMode,
    goal: alert.goal,
    contractTypes: alert.contractTypes,
    regimes: alert.regimes,
    sectors: alert.sectors,
    languages: alert.languages,
    frequency: alert.frequency,
    isActive: alert.isActive,
    createdAt: alert.createdAt,
  };
}

const locationSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().min(1).max(120),
  type: z.enum(["Pays", "Régions", "Provinces", "Arrondissements", "Communes", "Localités"]),
  postalCode: z.string().max(10).optional(),
  code: z.string().max(10).optional(),
});

const createAlertSchema = z.object({
  name: z.string().trim().max(120).optional(),
  keywords: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
  locations: z.array(locationSchema).max(10).default([]),
  booleanMode: z.enum(["AND", "OR"]).default("OR"),
  goal: z.enum(["job", "internship"]).default("job"),
  contractTypes: z.array(contractTypeSchema).max(12).default([]),
  regimes: z.array(z.string().min(1).max(60)).max(5).default([]),
  sectors: z.array(z.string().min(1).max(120)).max(5).default([]),
  languages: z.array(z.string().min(1).max(40)).max(5).default([]),
  consent: z.literal(true),
});

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Impossible de charger vos alertes." },
  async ({ user }) => {
    const alerts = await listJobAlerts(user.id);
    return NextResponse.json({
      alerts: alerts.map((alert) => ({
        id: alert.id,
        name: alert.name,
        keywords: alert.keywords,
        booleanMode: alert.booleanMode,
        goal: alert.goal,
        contractTypes: alert.contractTypes,
        regimes: alert.regimes,
        sectors: alert.sectors,
        languages: alert.languages,
        frequency: alert.frequency,
        isActive: alert.isActive,
        createdAt: alert.createdAt,
        lastSentAt: alert.lastSentAt,
      })),
    });
  }
);

/**
 * Creates an email alert for the signed-in user.
 *
 * `consent: true` is required by the schema: the UI must show an explicit opt-in
 * (GDPR, and a plain good practice for transactional-ish emails). Alerts are
 * capped so one account cannot flood the shared Resend quota.
 */
export const POST = withSessionHandler(
  {
    access: "user",
    body: createAlertSchema,
    fallbackMessage: "Impossible de créer l'alerte.",
  },
  async ({ user, body }) => {
    const existing = await listJobAlerts(user.id);
    if (existing.length >= 5) {
      return NextResponse.json(
        { error: "Vous avez déjà 5 alertes. Supprimez-en une pour en créer une autre." },
        { status: 409 }
      );
    }

    const alert = await createJobAlert(user.id, {
      name: body.name?.trim() || defaultAlertName(body),
      keywords: body.keywords,
      locations: body.locations,
      booleanMode: body.booleanMode,
      goal: body.goal,
      contractTypes: body.contractTypes,
      regimes: body.regimes,
      sectors: body.sectors,
      languages: body.languages,
    });

    return NextResponse.json({ alert: publicAlert(alert) }, { status: 201 });
  }
);

function defaultAlertName(body: { keywords: string[]; locations: { name: string }[] }): string {
  const keywords = body.keywords.join(", ");
  const places = body.locations.map((location) => location.name).join(", ");
  const parts = [keywords, places].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ").slice(0, 120) : "Ma recherche d'offres";
}
