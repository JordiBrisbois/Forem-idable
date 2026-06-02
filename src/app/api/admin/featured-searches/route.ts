import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { requireAdminAccess, markCoachAction } from "@/lib/server/coach";
import { createFeaturedSearch, listFeaturedSearchesForAdmin } from "@/lib/server/featuredSearches";
import { featuredSearchPayloadSchema } from "@/features/featured-searches/featuredSearchSchema";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function GET() {
  try {
    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const featuredSearches = await listFeaturedSearchesForAdmin();
    return NextResponse.json({ featuredSearches });
  } catch {
    return NextResponse.json(
      { error: "Chargement des recherches mises en avant impossible." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const admin = await requireAdminAccess();
      if (!admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const body = featuredSearchPayloadSchema.safeParse(await request.json());
      if (!body.success) {
        return NextResponse.json({ error: "Demande invalide." }, { status: 400 });
      }

      const featuredSearch = await createFeaturedSearch(body.data);
      await markCoachAction(admin.id);
      await recordAuditEvent({
        actorUserId: admin.id,
        action: "featured_search_created",
        payload: {
          featuredSearchId: featuredSearch.id,
          title: featuredSearch.title,
        },
      });
      logServerEvent({
        category: "admin",
        action: "featured_search_created",
        meta: {
          actorUserId: admin.id,
          featuredSearchId: featuredSearch.id,
        },
      });

      return NextResponse.json({ featuredSearch }, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: "Création de la recherche mise en avant impossible." },
        { status: 500 }
      );
    }
  });
}
