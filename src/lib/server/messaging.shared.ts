import { z } from "zod";

import { isValidForemOfferId } from "@/lib/forem";
import { fetchForemJobByOfferId } from "@/services/api/foremClient";
import { Job } from "@/types/job";
import {
  ConversationMessage,
  ConversationMessageAuthor,
  ConversationPreview,
} from "@/types/messaging";
import { ConversationSummaryRow, MessageRow } from "@/lib/server/messaging.types";

export function toNumericId(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getDisplayName(input: { firstName: string; lastName: string; email: string }) {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  return fullName || input.email;
}

export function normalizeConversationPreview(row: ConversationSummaryRow): ConversationPreview {
  const conversationId = toNumericId(row.id) ?? 0;

  return {
    id: conversationId,
    type: row.type,
    groupId: toNumericId(row.group_id),
    title:
      row.type === "group"
        ? row.group_name || "Groupe"
        : getDisplayName({
            firstName: row.other_user_first_name || "",
            lastName: row.other_user_last_name || "",
            email: row.other_user_email || "",
          }) || "Correspondant",
    subtitle:
      row.type === "group"
        ? `${row.participant_count} participant${row.participant_count > 1 ? "s" : ""}`
        : row.other_user_email,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    unreadCount: row.unread_count,
    participantCount: row.participant_count,
  };
}

function toConversationMessageAuthor(row: MessageRow): ConversationMessageAuthor | null {
  const authorUserId = toNumericId(row.author_user_id);
  if (authorUserId === null) {
    return null;
  }

  return {
    userId: authorUserId,
    firstName: row.author_first_name || "",
    lastName: row.author_last_name || "",
    email: row.author_email || "",
    role: row.author_role || "user",
  };
}

export function toConversationMessage(row: MessageRow, actorId: number): ConversationMessage {
  const messageId = toNumericId(row.id) ?? 0;
  const conversationId = toNumericId(row.conversation_id) ?? 0;
  const authorUserId = toNumericId(row.author_user_id);

  return {
    id: messageId,
    conversationId,
    type: row.type,
    content: row.content,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    author: toConversationMessageAuthor(row),
    isOwnMessage: authorUserId === actorId,
  };
}

function extractForemOfferIdFromText(content: string): { offerId: string; url: string } | null {
  const match = content.match(
    /https?:\/\/(?:www\.)?leforem\.be\/recherche-offres\/offre-detail\/(\d+)(?:[/?#][^\s]*)?/i
  );
  if (!match) {
    return null;
  }

  const offerId = match[1]?.trim() ?? "";
  if (!isValidForemOfferId(offerId)) {
    return null;
  }

  return {
    offerId,
    url: match[0],
  };
}

const sharedJobMetadataSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    metadata: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal("job_share"),
    metadata: z.object({
      sharedJob: z.object({
        id: z.string(),
        title: z.string(),
        company: z.string().optional(),
        location: z.string(),
        contractType: z.string(),
        publicationDate: z.string(),
        url: z.string(),
        description: z.string().optional(),
        source: z.enum(["forem", "linkedin", "indeed", "adzuna"]),
        pdfUrl: z.string().optional(),
      }),
      sharedOfferId: z.string(),
      sharedUrl: z.string(),
    }),
  }),
]);

export async function resolveSharedJobMetadata(content: string): Promise<{
  type: ConversationMessage["type"];
  metadata: Record<string, unknown> & {
    sharedJob?: Job;
    sharedOfferId?: string;
    sharedUrl?: string;
  };
}> {
  const extracted = extractForemOfferIdFromText(content);
  if (!extracted) {
    return sharedJobMetadataSchema.parse({
      type: "text",
      metadata: {},
    });
  }

  try {
    const sharedJob = await fetchForemJobByOfferId(extracted.offerId);
    if (!sharedJob) {
      return sharedJobMetadataSchema.parse({
        type: "text",
        metadata: {},
      });
    }

    return sharedJobMetadataSchema.parse({
      type: "job_share",
      metadata: {
        sharedJob,
        sharedOfferId: extracted.offerId,
        sharedUrl: extracted.url,
      },
    });
  } catch (error) {
    console.error("Unable to resolve Forem offer preview for messaging", error);
    return sharedJobMetadataSchema.parse({
      type: "text",
      metadata: {},
    });
  }
}
