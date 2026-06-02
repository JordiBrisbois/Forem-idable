import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { readValidatedJson, resetPasswordRequestSchema } from "@/lib/server/requestSchemas";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { isPasswordResetEnabled } from "@/lib/server/mail";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      if (!isPasswordResetEnabled()) {
        return NextResponse.json({ error: "Fonction désactivée." }, { status: 404 });
      }

      const parsed = await readValidatedJson(request, resetPasswordRequestSchema);
      const token = parsed.success ? parsed.data.token : "";

      const rateLimit = await checkRateLimit({
        scope: "auth-reset-password",
        limit: 5,
        windowMs: 30 * 60 * 1000,
        identifier: token || null,
      });
      if (!rateLimit.allowed) {
        logServerEvent({
          category: "security",
          action: "auth_rate_limited",
          level: "warn",
          meta: { scope: "auth-reset-password", retryAfterMs: rateLimit.retryAfterMs },
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
      const success = await resetPasswordWithToken(token, password);
      if (!success) {
        return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Réinitialisation impossible." }, { status: 500 });
    }
  });
}
