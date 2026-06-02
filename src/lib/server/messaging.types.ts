import { db } from "@/lib/server/db";
import { UserRole } from "@/types/auth";
import { ConversationMessage, ConversationPreview } from "@/types/messaging";

export type Queryable = NonNullable<typeof db>;

export type ParticipantRow = {
  user_id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  role_snapshot: UserRole;
  joined_at: string;
  left_at: string | null;
};

export type MessageRow = {
  id: number | string;
  conversation_id: number | string;
  type: ConversationMessage["type"];
  content: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  author_user_id: number | string | null;
  author_first_name: string | null;
  author_last_name: string | null;
  author_email: string | null;
  author_role: UserRole | null;
};

export type ConversationSummaryRow = {
  id: number | string;
  type: ConversationPreview["type"];
  group_id: number | null;
  group_name: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  participant_count: number;
  unread_count: number;
  other_user_first_name: string | null;
  other_user_last_name: string | null;
  other_user_email: string | null;
};
