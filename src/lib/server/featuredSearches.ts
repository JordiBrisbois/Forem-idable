import { asc, desc, eq } from "drizzle-orm";
import { ensureDatabase, orm } from "@/lib/server/db";
import { featuredSearches } from "@/lib/server/schema";
import { FeaturedSearchPayload, featuredSearchQuerySchema } from "@/features/featured-searches/featuredSearchSchema";
import { FeaturedSearch } from "@/types/featuredSearch";

function toFeaturedSearch(row: {
  id: number;
  title: string;
  message: string;
  ctaLabel: string;
  query: unknown;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): FeaturedSearch {
  const parsedQuery = featuredSearchQuerySchema.parse(row.query);

  return {
    id: row.id,
    title: row.title,
    message: row.message,
    ctaLabel: row.ctaLabel,
    query: parsedQuery,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getBaseSelect() {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  return orm.select({
    id: featuredSearches.id,
    title: featuredSearches.title,
    message: featuredSearches.message,
    ctaLabel: featuredSearches.ctaLabel,
    query: featuredSearches.query,
    isActive: featuredSearches.isActive,
    sortOrder: featuredSearches.sortOrder,
    createdAt: featuredSearches.createdAt,
    updatedAt: featuredSearches.updatedAt,
  });
}

export async function listActiveFeaturedSearches() {
  const rows = await (await getBaseSelect())
    .from(featuredSearches)
    .where(eq(featuredSearches.isActive, true))
    .orderBy(asc(featuredSearches.sortOrder), desc(featuredSearches.updatedAt));

  return rows.map(toFeaturedSearch);
}

export async function listFeaturedSearchesForAdmin() {
  const rows = await (await getBaseSelect())
    .from(featuredSearches)
    .orderBy(asc(featuredSearches.sortOrder), desc(featuredSearches.updatedAt));

  return rows.map(toFeaturedSearch);
}

export async function createFeaturedSearch(input: FeaturedSearchPayload) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [created] = await orm
    .insert(featuredSearches)
    .values({
      title: input.title,
      message: input.message,
      ctaLabel: input.ctaLabel,
      query: input.query,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      updatedAt: new Date(),
    })
    .returning({
      id: featuredSearches.id,
      title: featuredSearches.title,
      message: featuredSearches.message,
      ctaLabel: featuredSearches.ctaLabel,
      query: featuredSearches.query,
      isActive: featuredSearches.isActive,
      sortOrder: featuredSearches.sortOrder,
      createdAt: featuredSearches.createdAt,
      updatedAt: featuredSearches.updatedAt,
    });

  return toFeaturedSearch(created);
}

export async function updateFeaturedSearch(id: number, input: FeaturedSearchPayload) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [updated] = await orm
    .update(featuredSearches)
    .set({
      title: input.title,
      message: input.message,
      ctaLabel: input.ctaLabel,
      query: input.query,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(featuredSearches.id, id))
    .returning({
      id: featuredSearches.id,
      title: featuredSearches.title,
      message: featuredSearches.message,
      ctaLabel: featuredSearches.ctaLabel,
      query: featuredSearches.query,
      isActive: featuredSearches.isActive,
      sortOrder: featuredSearches.sortOrder,
      createdAt: featuredSearches.createdAt,
      updatedAt: featuredSearches.updatedAt,
    });

  return updated ? toFeaturedSearch(updated) : null;
}

export async function deleteFeaturedSearch(id: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [deleted] = await orm
    .delete(featuredSearches)
    .where(eq(featuredSearches.id, id))
    .returning({ id: featuredSearches.id });

  return Boolean(deleted);
}
