import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";

export function formatRelativeTime(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (isToday(date)) {
    return `aujourd'hui à ${format(date, "HH:mm", { locale: fr })}`;
  }

  if (isYesterday(date)) {
    return `hier à ${format(date, "HH:mm", { locale: fr })}`;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  }

  return format(date, "dd MMM", { locale: fr });
}
