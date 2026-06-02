import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { forgotPasswordRequestSchema, readValidatedJson } from "@/lib/server/requestSchemas";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { isPasswordResetEnabled, sendPasswordResetEmail } from "@/lib/server/mail";

const GENERIC_SUCCESS_MESSAGE =
  "Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      if (!isPasswordResetEnabled()) {
        return NextResponse.json({ error: "Fonction désactivée." }, { status: 404 });
      }

      const parsed = await readValidatedJson(request, forgotPasswordRequestSchema);
      const email = parsed.success ? parsed.data.email : "";

      const rateLimit = await checkRateLimit({
        scope: "auth-forgot-password",
        limit: 5,
        windowMs: 30 * 60 * 1000,
        identifier: email || null,
      });
      if (!rateLimit.allowed) {
        logServerEvent({
          category: "security",
          action: "auth_rate_limited",
          level: "warn",
          meta: { scope: "auth-forgot-password", retryAfterMs: rateLimit.retryAfterMs },
        });
        return NextResponse.json(
          { error: "Trop de tentatives. Réessayez dans quelques minutes." },
          { status: 429 }
        );
      }

      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const resetData = await createPasswordResetToken(email);
      if (resetData) {
        await sendPasswordResetEmail({
          to: resetData.user.email,
          firstName: resetData.user.firstName,
          token: resetData.token,
        });
      }

      return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE });
    } catch {
      return NextResponse.json({ error: "Envoi impossible." }, { status: 500 });
    }
  });
}
