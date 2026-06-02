import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { markCoachAction, requireAdminAccess } from "@/lib/server/coach";
import { deleteFeaturedSearch, updateFeaturedSearch } from "@/lib/server/featuredSearches";
import { featuredSearchPayloadSchema } from "@/features/featured-searches/featuredSearchSchema";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

function parseFeaturedSearchId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const admin = await requireAdminAccess();
      if (!admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { id: rawId } = await context.params;
      const id = parseFeaturedSearchId(rawId);
      if (!id) {
        return NextResponse.json({ error: "Recherche invalide." }, { status: 400 });
      }

      const body = featuredSearchPayloadSchema.safeParse(await request.json());
      if (!body.success) {
        return NextResponse.json({ error: "Demande invalide." }, { status: 400 });
      }

      const featuredSearch = await updateFeaturedSearch(id, body.data);
      if (!featuredSearch) {
        return NextResponse.json({ error: "Recherche introuvable." }, { status: 404 });
      }

      await markCoachAction(admin.id);
      await recordAuditEvent({
        actorUserId: admin.id,
        action: "featured_search_updated",
        payload: {
          featuredSearchId: featuredSearch.id,
          title: featuredSearch.title,
        },
      });
      logServerEvent({
        category: "admin",
        action: "featured_search_updated",
        meta: {
          actorUserId: admin.id,
          featuredSearchId: featuredSearch.id,
        },
      });

      return NextResponse.json({ featuredSearch });
    } catch {
      return NextResponse.json(
        { error: "Mise à jour de la recherche mise en avant impossible." },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const admin = await requireAdminAccess();
      if (!admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { id: rawId } = await context.params;
      const id = parseFeaturedSearchId(rawId);
      if (!id) {
        return NextResponse.json({ error: "Recherche invalide." }, { status: 400 });
      }

      const deleted = await deleteFeaturedSearch(id);
      if (!deleted) {
        return NextResponse.json({ error: "Recherche introuvable." }, { status: 404 });
      }

      await markCoachAction(admin.id);
      await recordAuditEvent({
        actorUserId: admin.id,
        action: "featured_search_deleted",
        payload: {
          featuredSearchId: id,
        },
      });
      logServerEvent({
        category: "admin",
        action: "featured_search_deleted",
        meta: {
          actorUserId: admin.id,
          featuredSearchId: id,
        },
      });

      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json(
        { error: "Suppression de la recherche mise en avant impossible." },
        { status: 500 }
      );
    }
  });
}
