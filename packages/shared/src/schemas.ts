import { z } from 'zod';

/**
 * Zod schemas for every client -> server payload. The server must parse
 * incoming payloads with these before acting on them; the client can use
 * the same schemas for form/input validation.
 */

export const userNameSchema = z
  .string()
  .trim()
  .min(1, 'Username must not be empty')
  .max(32, 'Username must be at most 32 characters');

export const privateMessageSchema = z.object({
  targetId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
});

export const fetchChatHistorySchema = z.object({
  targetId: z.string().uuid(),
});

export type PrivateMessageInput = z.infer<typeof privateMessageSchema>;
export type FetchChatHistoryInput = z.infer<typeof fetchChatHistorySchema>;
