import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { markCoachAction } from "@/lib/server/coach";
import { createFeaturedSearch, listFeaturedSearchesForAdmin } from "@/lib/server/featuredSearches";
import { featuredSearchPayloadSchema } from "@/features/featured-searches/featuredSearchSchema";
import { logServerEvent } from "@/lib/server/observability";

export const GET = withSessionHandler(
  { access: "admin", fallbackMessage: "Chargement des recherches mises en avant impossible." },
  async () => NextResponse.json({ featuredSearches: await listFeaturedSearchesForAdmin() })
);

export const POST = withSessionHandler(
  {
    access: "admin",
    body: featuredSearchPayloadSchema,
    bodyErrorMessage: "Demande invalide.",
    fallbackMessage: "Création de la recherche mise en avant impossible.",
  },
  async ({ user, body }) => {
    const featuredSearch = await createFeaturedSearch(body);
    await markCoachAction(user.id);
    await recordAuditEvent({
      actorUserId: user.id,
      action: "featured_search_created",
      payload: { featuredSearchId: featuredSearch.id, title: featuredSearch.title },
    });
    logServerEvent({
      category: "admin",
      action: "featured_search_created",
      meta: { actorUserId: user.id, featuredSearchId: featuredSearch.id },
    });

    return NextResponse.json({ featuredSearch }, { status: 201 });
  }
);
