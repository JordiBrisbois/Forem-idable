import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { checkRateLimit } from "@/lib/server/rateLimit";
import {
  createCalendarSubscription,
  regenerateCalendarSubscription,
} from "@/lib/server/calendarSubscriptions";
import { canManageCoachGroup, markCoachAction, requireCoachAccess } from "@/lib/server/coach";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import {
  calendarSubscriptionCreateSchema,
  readValidatedJson,
} from "@/lib/server/requestSchemas";
import { CalendarSubscriptionScope } from "@/types/calendar";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    let body: { scope: CalendarSubscriptionScope; groupId?: number; regenerate?: boolean } = { scope: "all_groups" };

    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const rateLimit = await checkRateLimit({
        scope: "coach-calendar-subscriptions",
        limit: 30,
        windowMs: 60 * 1000,
      });
      if (!rateLimit.allowed) {
        return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
      }

      const actor = await requireCoachAccess();
      if (!actor) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const parsed = await readValidatedJson(request, calendarSubscriptionCreateSchema);
      if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
      body = parsed.data;
      const { scope, groupId, regenerate = false } = body;

      if (scope === "group" && groupId !== undefined && !(await canManageCoachGroup(actor, groupId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (regenerate && actor.role !== "admin") {
        return NextResponse.json({ error: "Régénération réservée aux admins." }, { status: 403 });
      }

      const subscription = regenerate
        ? await regenerateCalendarSubscription({
            scope,
            groupId: scope === "group" ? (groupId ?? null) : null,
            actorId: actor.id,
          })
        : await createCalendarSubscription({
            scope,
            groupId: scope === "group" ? (groupId ?? null) : null,
            actorId: actor.id,
          });

      await markCoachAction(actor.id);

      return NextResponse.json({ subscription });
    } catch (error) {
      const scope = body.scope;
      const groupId = body.groupId;
      const message = error instanceof Error ? error.message : "";

      logServerEvent({
        category: "coach",
        action: "calendar_subscription_failed",
        level: message === "Group not found" || message === "Invalid group" ? "warn" : "error",
        meta: {
          scope: scope || undefined,
          groupId: typeof groupId === "number" && groupId > 0 ? groupId : undefined,
          regenerate: body.regenerate === true,
          error: message || "unknown",
        },
      });

      if (message === "Group not found") {
        return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
      }
      if (message === "Invalid group") {
        return NextResponse.json({ error: "Groupe invalide." }, { status: 400 });
      }

      return NextResponse.json({ error: "Gestion du calendrier impossible." }, { status: 500 });
    }
  });
}
