import { NextResponse } from "next/server";
import { withExternalHandler } from "@/lib/server/apiHandler";
import {
  deleteExternalApplication,
  getExternalApplicationDetail,
  patchExternalApplication,
} from "@/lib/server/externalApi";
import { patchEnvelopeSchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const GET = withExternalHandler(
  { fallbackMessage: "Lecture candidature impossible." },
  async ({ actor, params }) => {
    const applicationId = parseRouteId(params.applicationId as string);
    if (!applicationId) {
      return NextResponse.json({ error: "Candidature invalide." }, { status: 400 });
    }

    const application = await getExternalApplicationDetail(actor, applicationId);
    if (!application) {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }

    return NextResponse.json({ actor, application });
  }
);

export const PATCH = withExternalHandler(
  {
    body: patchEnvelopeSchema,
    bodyErrorMessage: "Patch invalide.",
    fallbackMessage: "Mise à jour candidature impossible.",
  },
  async ({ actor, body, params }) => {
    const applicationId = parseRouteId(params.applicationId as string);
    if (!applicationId) {
      return NextResponse.json({ error: "Candidature invalide." }, { status: 400 });
    }

    const response = await patchExternalApplication(actor, applicationId, body.patch);
    return NextResponse.json(response);
  }
);

export const DELETE = withExternalHandler(
  { fallbackMessage: "Suppression candidature impossible." },
  async ({ actor, params }) => {
    const applicationId = parseRouteId(params.applicationId as string);
    if (!applicationId) {
      return NextResponse.json({ error: "Candidature invalide." }, { status: 400 });
    }

    await deleteExternalApplication(actor, applicationId);
    return NextResponse.json({ success: true });
  }
);
