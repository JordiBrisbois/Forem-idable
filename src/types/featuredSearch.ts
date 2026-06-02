import { SearchQuery } from "@/types/search";

export interface FeaturedSearch {
  id: number;
  title: string;
  message: string;
  ctaLabel: string;
  query: SearchQuery;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
