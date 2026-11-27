import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/offres/"],
        disallow: ["/api/", "/admin", "/coach", "/account", "/messages", "/applications", "/scout", "/setup"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
