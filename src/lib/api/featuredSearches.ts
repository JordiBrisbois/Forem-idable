import { get } from "@/lib/api/client";
import { FeaturedSearch } from "@/types/featuredSearch";

export function fetchFeaturedSearches() {
  return get<{ featuredSearches?: FeaturedSearch[] }>("/api/featured-searches", {
    cache: "no-store",
  });
}
