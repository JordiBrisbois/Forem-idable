import { z } from "zod";

export const directConversationRequestSchema = z
  .object({
    targetUserId: z.number().int().positive(),
  })
  .strict();

export const sendConversationMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(4000),
  })
  .strict();

export const shareDirectMessageSchema = z
  .object({
    targetUserId: z.number().int().positive(),
    content: z.string().trim().min(1).max(4000),
  })
  .strict();
