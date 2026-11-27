import { NextResponse } from "next/server";
import { z } from "zod";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { deleteJobAlert, setJobAlertActive } from "@/lib/server/alerts/repository";

const patchSchema = z.object({
  isActive: z.boolean(),
});

/**
 * Turns emailing on or off for one alert without deleting it.
 *
 * The unsubscribe link in an email does the same thing without a session; this
 * route is for the account page, where the user is already signed in.
 */
export const PATCH = withSessionHandler(
  {
    access: "user",
    body: patchSchema,
    fallbackMessage: "Impossible de modifier cette alerte.",
  },
  async ({ user, params, body }) => {
    const alertId = Number(params.alertId);

    if (!Number.isInteger(alertId) || alertId <= 0) {
      return NextResponse.json({ error: "Alerte inconnue." }, { status: 400 });
    }

    const updated = await setJobAlertActive(user.id, alertId, body.isActive);
    if (!updated) {
      return NextResponse.json({ error: "Alerte inconnue." }, { status: 404 });
    }

    return NextResponse.json({ success: true, isActive: body.isActive });
  }
);
export const DELETE = withSessionHandler(
  { access: "user", fallbackMessage: "Impossible de supprimer l''alerte." },
  async ({ user, params }) => {
    const alertId = Number(params.alertId);

    if (!Number.isInteger(alertId) || alertId <= 0) {
      return NextResponse.json({ error: "Alerte inconnue." }, { status: 400 });
    }

    const deleted = await deleteJobAlert(user.id, alertId);
    if (!deleted) {
      return NextResponse.json({ error: "Alerte inconnue." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  }
);