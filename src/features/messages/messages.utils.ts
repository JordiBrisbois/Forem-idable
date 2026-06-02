"use client";

import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { ConversationMessage } from "@/types/messaging";

export function getDisplayName(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
  fallback: string;
}) {
  const fullName = `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();
  return fullName || input.email || input.fallback;
}

export function getInitials(label: string) {
  const chunks = label.trim().split(/\s+/).filter(Boolean);
  if (chunks.length === 0) return "??";
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
  return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
}

export function stringToHslColor(str: string, saturation = 65, lightness = 52) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function stringToHslBackground(str: string) {
  return stringToHslColor(str, 55, 92);
}

export function stringToHslForeground(str: string) {
  return stringToHslColor(str, 70, 30);
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export interface MessageGroup {
  authorKey: string;
  authorName: string;
  isOwnMessage: boolean;
  messages: ConversationMessage[];
  timestamp: Date;
}

export function groupMessagesByAuthor(messages: ConversationMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  for (const message of messages) {
    const authorName = message.author
      ? getDisplayName({
          firstName: message.author.firstName,
          lastName: message.author.lastName,
          email: message.author.email,
          fallback: "Message",
        })
      : "Système";
    const authorKey = message.author?.userId?.toString() ?? "system";
    const msgDate = new Date(message.createdAt);

    const lastGroup = groups[groups.length - 1];
    const canAppend =
      lastGroup &&
      lastGroup.authorKey === authorKey &&
      !lastGroup.messages.some((m) => m.type === "job_share") &&
      msgDate.getTime() - lastGroup.timestamp.getTime() <= GROUP_WINDOW_MS;

    if (canAppend) {
      lastGroup.messages.push(message);
      lastGroup.timestamp = msgDate;
    } else {
      groups.push({
        authorKey,
        authorName,
        isOwnMessage: message.isOwnMessage,
        messages: [message],
        timestamp: msgDate,
      });
    }
  }

  return groups;
}

export function formatMessageDateSeparator(date: Date): string {
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return "Hier";
  return format(date, "EEEE d MMMM", { locale: fr });
}
