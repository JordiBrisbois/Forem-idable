import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import {
  createTrackedApplicationForUser,
  listApplicationsForUser,
} from "@/lib/server/applications";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import {
  readValidatedJson,
  trackedApplicationCreateRequestSchema,
} from "@/lib/server/requestSchemas";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await listApplicationsForUser(user.id);
    return NextResponse.json({ applications });
  } catch {
    return NextResponse.json({ error: "Impossible de charger les candidatures." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await readValidatedJson(request, trackedApplicationCreateRequestSchema);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const body = parsed.data;
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
  } catch {
    return NextResponse.json({ error: "Impossible d'ajouter la candidature." }, { status: 500 });
  }
}
