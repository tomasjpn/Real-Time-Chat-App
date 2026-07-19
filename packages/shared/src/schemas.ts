import { z } from 'zod';

/**
 * Zod schemas for every client -> server payload. The server must parse
 * incoming payloads with these before acting on them; the client uses the
 * same schemas for form validation, so both sides agree by construction.
 */

export const usernameSchema = z
  .string()
  .trim()
  .regex(
    /^[a-zA-Z0-9_]{3,32}$/,
    'Username must be 3-32 characters using only letters, numbers, and underscores'
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name must not be empty')
  .max(50, 'Display name must be at most 50 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const registerSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema.optional(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const privateMessageSchema = z.object({
  targetId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
});

export const fetchChatHistorySchema = z.object({
  targetId: z.string().uuid(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PrivateMessageInput = z.infer<typeof privateMessageSchema>;
export type FetchChatHistoryInput = z.infer<typeof fetchChatHistorySchema>;
