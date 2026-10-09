import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import {
  deleteCoachManagedApplication,
  updateCoachManagedApplication,
} from "@/lib/server/coach";
import { patchEnvelopeSchema } from "@/lib/server/requestSchemas";
import { parseRouteId } from "@/lib/server/routeParams";

export const PATCH = withSessionHandler(
  {
    access: "coach",
    body: patchEnvelopeSchema,
    bodyErrorMessage: "Modification invalide.",
    fallbackMessage: "Impossible de mettre à jour la candidature.",
  },
  async ({ user, body, params }) => {
    const userId = parseRouteId(params.userId as string);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    const application = await updateCoachManagedApplication({
      actor: user,
      userId,
      jobId: params.jobId as string,
      patch: body.patch,
    });

    return NextResponse.json({ application });
  }
);

export const DELETE = withSessionHandler(
  { access: "coach", fallbackMessage: "Impossible de supprimer la candidature." },
  async ({ user, params }) => {
    const userId = parseRouteId(params.userId as string);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    await deleteCoachManagedApplication({
      actor: user,
      userId,
      jobId: params.jobId as string,
    });

    return NextResponse.json({ success: true });
  }
);
