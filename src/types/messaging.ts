import { UserRole } from "@/types/auth";
import { Job } from "@/types/job";

export type ConversationType = "group" | "direct";
export type ConversationMessageType = "text" | "job_share";

export interface ConversationParticipantSummary {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  joinedAt: string;
  leftAt: string | null;
}

export interface ConversationPreview {
  id: number;
  type: ConversationType;
  groupId: number | null;
  title: string;
  subtitle: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  participantCount: number;
}

export interface ConversationMessageAuthor {
  userId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface ConversationMessage {
  id: number;
  conversationId: number;
  type: ConversationMessageType;
  content: string | null;
  metadata: Record<string, unknown> & {
    sharedJob?: Job;
    sharedOfferId?: string;
    sharedUrl?: string;
  };
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  author: ConversationMessageAuthor | null;
  isOwnMessage: boolean;
}

export interface ConversationDetail extends ConversationPreview {
  canModerateMessages: boolean;
  participants: ConversationParticipantSummary[];
  messages: ConversationMessage[];
}

export interface DirectMessageTarget {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  sharedGroupCount: number;
  relationLabel: string;
}

export type MessageStreamEvent =
  | {
      type: "stream.connected";
      connectedAt: string;
    }
  | {
      type: "conversation.created";
      conversationId: number;
    }
  | {
      type: "conversation.message_created";
      conversationId: number;
      messageId: number;
      message: ConversationMessage;
    }
  | {
      type: "conversation.message_deleted";
      conversationId: number;
      messageId: number;
    }
  | {
      type: "conversation.read_updated";
      conversationId: number;
      userId: number;
    }
  | {
      type: "conversation.cleared";
      conversationId: number;
    };
