import { NextRequest, NextResponse } from "next/server";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { readValidatedJson, setupRequestSchema } from "@/lib/server/requestSchemas";
import { createFirstAdmin } from "@/lib/server/setup";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const rateLimit = await checkRateLimit({
        scope: "setup",
        limit: 5,
        windowMs: 60 * 60 * 1000,
        identifier: null,
      });
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: "Trop de tentatives. Réessayez plus tard." },
          { status: 429 }
        );
      }

      const parsed = await readValidatedJson(request, setupRequestSchema);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const admin = await createFirstAdmin(parsed.data);
      return NextResponse.json({ user: admin });
    } catch (error) {
      if (error instanceof Error && error.message === "AlreadySetup") {
        return NextResponse.json(
          { error: "Cette instance est déjà configurée." },
          { status: 409 }
        );
      }

      const message = error instanceof Error ? error.message : "unknown";
      if (message.includes("duplicate") || message.includes("unique")) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cette adresse email." },
          { status: 409 }
        );
      }

      logServerEvent({
        category: "admin",
        action: "setup_failed",
        level: "error",
        meta: { error: message },
      });

      return NextResponse.json({ error: "Configuration impossible." }, { status: 500 });
    }
  });
}
