import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import {
  deleteApplicationForUser,
  updateApplicationForUser,
} from "@/lib/server/applications";
import { normalizeApplicationPatch, patchEnvelopeSchema } from "@/lib/server/requestSchemas";

export const PATCH = withSessionHandler(
  {
    access: "user",
    body: patchEnvelopeSchema,
    fallbackMessage: "Impossible de mettre à jour la candidature.",
  },
  async ({ user, body, params }) => {
    const jobId = params.jobId as string;
    const application = await updateApplicationForUser({
      userId: user.id,
      jobId,
      patch: normalizeApplicationPatch(jobId, body.patch),
    });

    return NextResponse.json({ application });
  }
);

export const DELETE = withSessionHandler(
  { access: "user", fallbackMessage: "Impossible de supprimer la candidature." },
  async ({ user, params }) => {
    await deleteApplicationForUser(user.id, params.jobId as string);
    return NextResponse.json({ success: true });
  }
);
