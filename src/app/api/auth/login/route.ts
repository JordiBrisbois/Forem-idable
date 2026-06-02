import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createSession } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { loginRequestSchema, readValidatedJson } from "@/lib/server/requestSchemas";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const parsed = await readValidatedJson(request, loginRequestSchema);
      const email = parsed.success ? parsed.data.email : "";

      const rateLimit = await checkRateLimit({
        scope: "auth-login",
        limit: 8,
        windowMs: 10 * 60 * 1000,
        identifier: email || null,
      });
      if (!rateLimit.allowed) {
        logServerEvent({
          category: "security",
          action: "auth_rate_limited",
          level: "warn",
          meta: {
            scope: "auth-login",
            retryAfterMs: rateLimit.retryAfterMs,
          },
        });
        return NextResponse.json(
          { error: "Trop de tentatives. Réessayez dans quelques minutes." },
          { status: 429 }
        );
      }

      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const { password } = parsed.data;

      const user = await authenticateUser(email, password);
      if (!user) {
        logServerEvent({
          category: "security",
          action: "auth_login_failed",
          level: "warn",
          meta: {
            hasIdentifier: Boolean(email),
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
          },
        });
        return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
      }

      await createSession(user.id);
      return NextResponse.json({ user });
    } catch {
      return NextResponse.json({ error: "Connexion impossible." }, { status: 500 });
    }
  });
}
