import { NextResponse } from "next/server";
import { withExternalHandler } from "@/lib/server/apiHandler";
import { saveExternalPrivateNote } from "@/lib/server/externalApi";
import { textContentSchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const PUT = withExternalHandler(
  {
    body: textContentSchema,
    bodyErrorMessage: "content requis.",
    fallbackMessage: "Enregistrement note privée impossible.",
  },
  async ({ actor, body, params }) => {
    const applicationId = parseRouteId(params.applicationId as string);
    if (!applicationId) {
      return NextResponse.json({ error: "Candidature invalide." }, { status: 400 });
    }

    const response = await saveExternalPrivateNote(actor, applicationId, body.content);
    return NextResponse.json(response);
  }
);
