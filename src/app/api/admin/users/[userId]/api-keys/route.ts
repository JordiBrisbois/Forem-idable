import { NextResponse } from "next/server";
import { db, ensureDatabase } from "@/lib/server/db";
import { requireAdminAccess } from "@/lib/server/coach";
import { listApiKeysForUser } from "@/lib/server/apiKeys";
import { UserRole } from "@/types/auth";

function parseUserId(value: string) {
  const userId = Number(value);
  return Number.isInteger(userId) ? userId : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId: rawUserId } = await context.params;
    const userId = parseUserId(rawUserId);
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

    if (target.role !== "coach" && target.role !== "admin") {
      return NextResponse.json({ error: "Aucune clé API à gérer pour ce rôle." }, { status: 400 });
    }

    const apiKeys = await listApiKeysForUser(userId);
    return NextResponse.json({ apiKeys: apiKeys.filter((entry) => !entry.revokedAt) });
  } catch {
    return NextResponse.json({ error: "Chargement des clés API impossible." }, { status: 500 });
  }
}
