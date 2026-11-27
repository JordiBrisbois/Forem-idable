import { runtimeConfig } from "@/config/runtime";
import { escapeHtml } from "@/lib/server/common";
import { isResendConfigured, sendResendEmail } from "@/lib/server/mailer";

export function isPasswordResetEnabled() {
  return process.env.PASSWORD_RESET_ENABLED === "true";
}

function getAppBaseUrl() {
  return (
    process.env.APP_BASE_URL?.trim() ||
    process.env.COOLIFY_URL?.trim() ||
    "http://localhost:3000"
  );
}

function getProjectLabel() {
  return runtimeConfig.app.name;
}

export function isPasswordResetMailConfigured() {
  return isPasswordResetEnabled() && isResendConfigured();
}

export function buildPasswordResetUrl(token: string) {
  const baseUrl = getAppBaseUrl().replace(/\/+$/, "");
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(input: {
  to: string;
  firstName: string;
  token: string;
}) {
  if (!isPasswordResetEnabled()) {
    throw new Error("Password reset disabled");
  }

  const resetUrl = buildPasswordResetUrl(input.token);
  const firstName = input.firstName.trim() || "bonjour";
  const escapedFirstName = escapeHtml(firstName);
  const escapedResetUrl = escapeHtml(resetUrl);
  const projectLabel = getProjectLabel();

  await sendResendEmail({
    to: input.to,
    subject: `Réinitialisation de votre mot de passe ${projectLabel}`,
    html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h1 style="font-size: 20px; margin-bottom: 16px;">Réinitialiser votre mot de passe</h1>
          <p>Bonjour ${escapedFirstName},</p>
          <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte ${escapeHtml(projectLabel)}.</p>
          <p>
            <a href="${escapedResetUrl}" style="display:inline-block;background:#0f62fe;color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:600;">
              Choisir un nouveau mot de passe
            </a>
          </p>
          <p>Si le bouton ne fonctionne pas, utilisez ce lien :</p>
          <p><a href="${escapedResetUrl}">${escapedResetUrl}</a></p>
          <p>Ce lien expire dans 60 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        </div>
      `,
    text: `Bonjour ${firstName},\n\nUtilisez ce lien pour réinitialiser votre mot de passe ${projectLabel} : ${resetUrl}\n\nCe lien expire dans 60 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.`,
  });
}
