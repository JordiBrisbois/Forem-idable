import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import {
  createTrackedApplicationForUser,
  listApplicationsForUser,
} from "@/lib/server/applications";
import { trackedApplicationCreateRequestSchema } from "@/lib/server/requestSchemas";

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Impossible de charger les candidatures." },
  async ({ user }) => NextResponse.json({ applications: await listApplicationsForUser(user.id) })
);

export const POST = withSessionHandler(
  {
    access: "user",
    body: trackedApplicationCreateRequestSchema,
    fallbackMessage: "Impossible d'ajouter la candidature.",
  },
  async ({ user, body }) => {
    const application = await createTrackedApplicationForUser({
      userId: user.id,
      job: body.job,
      appliedAt: body.appliedAt,
      status: body.status,
      notes: body.notes ?? undefined,
      proofs: body.proofs ?? undefined,
      interviewAt: body.interviewAt ?? undefined,
      interviewDetails: body.interviewDetails ?? undefined,
    });

    return NextResponse.json({ application });
  }
);
