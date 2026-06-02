import { NextRequest, NextResponse } from "next/server";
import { createSession, createUser } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { readValidatedJson, registerRequestSchema } from "@/lib/server/requestSchemas";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const parsed = await readValidatedJson(request, registerRequestSchema);
      const email = parsed.success ? parsed.data.email : "";

      const rateLimit = await checkRateLimit({
        scope: "auth-register",
        limit: 3,
        windowMs: 60 * 60 * 1000,
        identifier: email || null,
      });
      if (!rateLimit.allowed) {
        logServerEvent({
          category: "security",
          action: "auth_rate_limited",
          level: "warn",
          meta: { scope: "auth-register", retryAfterMs: rateLimit.retryAfterMs },
        });
        return NextResponse.json(
          { error: "Trop de tentatives. Réessayez dans quelques minutes." },
          { status: 429 }
        );
      }

      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const { password, firstName, lastName } = parsed.data;
      const user = await createUser(email, password, firstName, lastName);
      await createSession(user.id);

      return NextResponse.json({ user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to register";
      const isDuplicate = message.includes("duplicate") || message.includes("unique");

      return NextResponse.json(
        { error: isDuplicate ? "Un compte existe déjà avec cette adresse email." : "Inscription impossible. Veuillez réessayer." },
        { status: isDuplicate ? 409 : 500 }
      );
    }
  });
}
