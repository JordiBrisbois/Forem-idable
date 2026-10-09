import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { markCoachAction } from "@/lib/server/coach";
import { deleteFeaturedSearch, updateFeaturedSearch } from "@/lib/server/featuredSearches";
import { featuredSearchPayloadSchema } from "@/features/featured-searches/featuredSearchSchema";
import { logServerEvent } from "@/lib/server/observability";
import { parseRouteId } from "@/lib/server/routeParams";

export const PATCH = withSessionHandler(
  {
    access: "admin",
    body: featuredSearchPayloadSchema,
    bodyErrorMessage: "Demande invalide.",
    fallbackMessage: "Mise à jour de la recherche mise en avant impossible.",
  },
  async ({ user, body, params }) => {
    const id = parseRouteId(params.id as string);
    if (!id) {
      return NextResponse.json({ error: "Recherche invalide." }, { status: 400 });
    }

    const featuredSearch = await updateFeaturedSearch(id, body);
    if (!featuredSearch) {
      return NextResponse.json({ error: "Recherche introuvable." }, { status: 404 });
    }

    await markCoachAction(user.id);
    await recordAuditEvent({
      actorUserId: user.id,
      action: "featured_search_updated",
      payload: { featuredSearchId: featuredSearch.id, title: featuredSearch.title },
    });
    logServerEvent({
      category: "admin",
      action: "featured_search_updated",
      meta: { actorUserId: user.id, featuredSearchId: featuredSearch.id },
    });

    return NextResponse.json({ featuredSearch });
  }
);

export const DELETE = withSessionHandler(
  {
    access: "admin",
    fallbackMessage: "Suppression de la recherche mise en avant impossible.",
  },
  async ({ user, params }) => {
    const id = parseRouteId(params.id as string);
    if (!id) {
      return NextResponse.json({ error: "Recherche invalide." }, { status: 400 });
    }

    const deleted = await deleteFeaturedSearch(id);
    if (!deleted) {
      return NextResponse.json({ error: "Recherche introuvable." }, { status: 404 });
    }

    await markCoachAction(user.id);
    await recordAuditEvent({
      actorUserId: user.id,
      action: "featured_search_deleted",
      payload: { featuredSearchId: id },
    });
    logServerEvent({
      category: "admin",
      action: "featured_search_deleted",
      meta: { actorUserId: user.id, featuredSearchId: id },
    });

    return NextResponse.json({ ok: true });
  }
);
