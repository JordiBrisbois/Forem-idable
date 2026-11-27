import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { deleteJobAlert } from "@/lib/server/alerts/repository";

export const DELETE = withSessionHandler(
  { access: "user", fallbackMessage: "Impossible de supprimer l'alerte." },
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
