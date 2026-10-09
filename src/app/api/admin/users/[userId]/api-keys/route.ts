import { NextResponse } from "next/server";
import { canCoach } from "@/lib/authz";
import { withSessionHandler } from "@/lib/server/apiHandler";
import { listApiKeysForUser } from "@/lib/server/apiKeys";
import { db, ensureDatabase } from "@/lib/server/db";
import { parseRouteId } from "@/lib/server/routeParams";
import { UserRole } from "@/types/auth";

export const GET = withSessionHandler(
  { access: "admin", fallbackMessage: "Chargement des clés API impossible." },
  async ({ params }) => {
    const userId = parseRouteId(params.userId as string);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    await ensureDatabase();
    const targetResult = await db.query<{ role: UserRole }>(
      `SELECT role FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const target = targetResult.rows[0];

    if (!target) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    if (!canCoach(target.role)) {
      return NextResponse.json(
        { error: "Aucune clé API à gérer pour ce rôle." },
        { status: 400 }
      );
    }

    const apiKeys = await listApiKeysForUser(userId);
    return NextResponse.json({ apiKeys: apiKeys.filter((entry) => !entry.revokedAt) });
  }
);
