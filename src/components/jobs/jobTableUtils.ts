"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatPublicationDateCompact(dateStr: string) {
  if (!dateStr) return "Date inconnue";
  const parsedDate = new Date(dateStr);
  if (Number.isNaN(parsedDate.getTime())) return "Date inconnue";
  return format(parsedDate, "dd MMM", { locale: fr });
}

export function formatPublicationDateTable(dateStr: string) {
  if (!dateStr) return "Date inconnue";
  const parsedDate = new Date(dateStr);
  if (Number.isNaN(parsedDate.getTime())) return "Date inconnue";
  return format(parsedDate, "dd MMM yyyy", { locale: fr });
}

export type PaginationItem = number | "ellipsis";

export function buildPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): PaginationItem[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const startPage = Math.max(2, currentPage - siblingCount);
  const endPage = Math.min(totalPages - 1, currentPage + siblingCount);
  const items: PaginationItem[] = [1];

  if (startPage > 2) {
    items.push("ellipsis");
  }

  for (let page = startPage; page <= endPage; page += 1) {
    items.push(page);
  }

  if (endPage < totalPages - 1) {
    items.push("ellipsis");
  }

  items.push(totalPages);
  return items;
}
