import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/siteUrl";
import { listSitemapOfferIds } from "@/lib/server/offers/repository";

export const revalidate = 3600;

/**
 * Sitemap with progressive offer indexing.
 *
 * Only offers whose full detail is already cached are listed: publishing the
 * whole catalogue at once would make crawlers trigger thousands of upstream
 * fetches, which is exactly the load we refuse to put on the Forem. The list
 * grows as pages are visited.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  try {
    const offers = await listSitemapOfferIds();
    return [
      ...entries,
      ...offers.map((offer) => ({
        url: `${base}/offres/${offer.id}`,
        lastModified: offer.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Database unavailable at build time: serve the static routes rather than a
    // broken sitemap. The next revalidation will pick the offers up.
    return entries;
  }
}
