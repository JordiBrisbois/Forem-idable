import { NextResponse } from "next/server";
import { runtimeConfig } from "@/config/runtime";
import { withExternalHandler } from "@/lib/server/apiHandler";
import {
  buildApplicationsCsv,
  getExternalApplications,
  upsertExternalApplication,
} from "@/lib/server/externalApi";
import {
  csvResponse,
  getRequestedFormat,
  parseExternalFilters,
} from "@/lib/server/externalApiRoute";
import { externalApplicationUpsertSchema } from "@/lib/server/requestSchemas";

export const GET = withExternalHandler(
  { fallbackMessage: "Export candidatures impossible." },
  async ({ request, actor }) => {
    const response = await getExternalApplications(actor, parseExternalFilters(request));
    if (getRequestedFormat(request) === "csv") {
      return csvResponse(
        `${runtimeConfig.app.exportFilenamePrefix}-applications.csv`,
        buildApplicationsCsv(response.applications)
      );
    }

    return NextResponse.json(response);
  }
);

export const PUT = withExternalHandler(
  {
    body: externalApplicationUpsertSchema,
    bodyErrorMessage: "match.userId, match.jobId et data.job.title sont requis.",
    fallbackMessage: "Upsert candidature impossible.",
  },
  async ({ actor, body }) => {
    const response = await upsertExternalApplication(actor, {
      match: { userId: body.match.userId, jobId: body.match.jobId },
      data: {
        status: body.data.status,
        notes: body.data.notes,
        proofs: body.data.proofs,
        interviewAt: body.data.interviewAt ?? undefined,
        interviewDetails: body.data.interviewDetails ?? undefined,
        lastFollowUpAt: body.data.lastFollowUpAt ?? undefined,
        followUpDueAt: body.data.followUpDueAt ?? undefined,
        followUpEnabled: body.data.followUpEnabled,
        appliedAt: body.data.appliedAt,
        job: {
          title: body.data.job.title,
          company: body.data.job.company,
          location: body.data.job.location,
          contractType: body.data.job.contractType,
          url: body.data.job.url,
          publicationDate: body.data.job.publicationDate,
          description: body.data.job.description,
          source: body.data.job.source,
          pdfUrl: body.data.job.pdfUrl,
        },
      },
    });

    return NextResponse.json(response, { status: response.created ? 201 : 200 });
  }
);
