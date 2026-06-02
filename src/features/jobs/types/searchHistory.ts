import { z } from "zod";
import { SearchQuery } from "@/types/search";
import { searchQuerySchema } from "@/types/search";

export interface SearchHistoryEntry {
  id: string;
  state: SearchQuery;
  createdAt: string;
}

export const searchHistoryEntrySchema = z.object({
  id: z.string().min(1),
  state: searchQuerySchema,
  createdAt: z.iso.datetime(),
});

export const searchHistoryArraySchema = z.array(searchHistoryEntrySchema);
