"use client";

import { get, post, del } from "@/lib/api/client";
import { JobApplication } from "@/types/application";
import { Job } from "@/types/job";
import {
  ConversationDetail,
  ConversationMessage,
  ConversationPreview,
  DirectMessageTarget,
} from "@/types/messaging";

export function fetchConversations() {
  return get<{ conversations?: ConversationPreview[] }>("/api/messages/conversations", {
    cache: "no-store",
  });
}

export async function fetchConversationDetail(
  conversationId: number,
  options?: { markAsRead?: boolean }
) {
  if (options?.markAsRead) {
    await post<Record<string, never>>(`/api/messages/conversations/${conversationId}/read`);
  }

  return get<{ conversation?: ConversationDetail }>(
    `/api/messages/conversations/${conversationId}`,
    { cache: "no-store" }
  );
}

export function fetchMessageContacts(signal?: AbortSignal) {
  return get<{ contacts?: DirectMessageTarget[] }>("/api/messages/contacts", {
    cache: "no-store",
    signal,
  });
}

export function fetchTrackedApplications() {
  return get<{ applications?: JobApplication[] }>("/api/applications", { cache: "no-store" });
}

export function postConversationMessage(conversationId: number, content: string) {
  return post<{ cleared?: boolean; message?: ConversationMessage }>(
    `/api/messages/conversations/${conversationId}/messages`,
    { content }
  );
}

export function createTrackedApplication(job: Job) {
  return post<Record<string, never>>("/api/applications", { job });
}

export function removeConversationMessage(conversationId: number, messageId: number) {
  return del<{ message?: ConversationMessage }>(
    `/api/messages/conversations/${conversationId}/messages/${messageId}`
  );
}

export function closeDirectMessageConversation(conversationId: number) {
  return post<Record<string, never>>(`/api/messages/conversations/${conversationId}/close`);
}

export function createDirectMessageConversation(targetUserId: number) {
  return post<{ conversation?: ConversationDetail }>("/api/messages/conversations/direct", {
    targetUserId,
  });
}

export function shareDirectMessage(targetUserId: number, content: string) {
  return post<Record<string, never>>("/api/messages/share/direct", { targetUserId, content });
}
