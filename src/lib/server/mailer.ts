/**
 * Thin Resend client shared by every email the app sends.
 *
 * Kept in one place so the API key, sender and reply-to are configured once and
 * a missing configuration fails the same way everywhere.
 */
export interface ResendEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function resendFrom(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    `${process.env.APP_NAME?.trim() || "Forem-idable"} <no-reply@example.com>`
  );
}

export function appBaseUrl(): string {
  return (
    process.env.APP_BASE_URL?.trim() ||
    process.env.COOLIFY_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export async function sendResendEmail(email: ResendEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Resend not configured");
  }

  const replyTo = process.env.RESEND_REPLY_TO?.trim();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom(),
      to: [email.to],
      reply_to: replyTo ? [replyTo] : undefined,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the email (HTTP ${response.status})`);
  }
}
