import { NextResponse } from "next/server";
import { withSessionHandler } from "@/lib/server/apiHandler";
import {
  addSearchHistoryEntryForUser,
  clearSearchHistoryForUser,
  listSearchHistoryForUser,
} from "@/lib/server/searchHistory";
import { searchHistoryArraySchema } from "@/features/jobs/types/searchHistory";
import { searchHistorySaveSchema } from "@/lib/server/requestSchemas";

export const GET = withSessionHandler(
  { access: "user", fallbackMessage: "Impossible de charger l'historique." },
  async ({ user }) =>
    NextResponse.json({
      history: searchHistoryArraySchema.parse(await listSearchHistoryForUser(user.id)),
    })
);

export const POST = withSessionHandler(
  {
    access: "user",
    body: searchHistorySaveSchema,
    fallbackMessage: "Impossible d'ajouter l'historique.",
  },
  async ({ user, body }) =>
    NextResponse.json({
      history: searchHistoryArraySchema.parse(
        await addSearchHistoryEntryForUser(user.id, body.entry)
      ),
    })
);

export const DELETE = withSessionHandler(
  { access: "user", fallbackMessage: "Impossible de vider l'historique." },
  async ({ user }) => {
    await clearSearchHistoryForUser(user.id);
    return NextResponse.json({ success: true });
  }
);
