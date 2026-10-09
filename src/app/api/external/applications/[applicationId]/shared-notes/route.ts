import { NextResponse } from "next/server";
import { withExternalHandler } from "@/lib/server/apiHandler";
import { createExternalSharedNote } from "@/lib/server/externalApi";
import { textContentSchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const POST = withExternalHandler(
  {
    body: textContentSchema,
    bodyErrorMessage: "content requis.",
    fallbackMessage: "Création note partagée impossible.",
  },
  async ({ actor, body, params }) => {
    const applicationId = parseRouteId(params.applicationId as string);
    if (!applicationId || !body.content.trim()) {
      return NextResponse.json({ error: "content requis." }, { status: 400 });
    }

    const response = await createExternalSharedNote(actor, applicationId, body.content);
    return NextResponse.json(response, { status: 201 });
  }
);
