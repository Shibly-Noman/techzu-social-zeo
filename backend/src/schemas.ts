import { z } from 'zod';

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username may only contain letters, numbers and underscores'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const loginSchema = z.object({
  /** Username or email. */
  identifier: z.string().trim().toLowerCase().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const fcmTokenSchema = z.object({
  token: z.string().min(1, 'FCM token is required').max(512),
});

export const createPostSchema = z.object({
  text: z.string().trim().min(1, 'Post text is required').max(500, 'Post is limited to 500 characters'),
});

export const createCommentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Comment text is required')
    .max(300, 'Comment is limited to 300 characters'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const feedQuerySchema = paginationSchema.extend({
  /** Optional username filter (prefix match, case-insensitive). */
  username: z.string().trim().toLowerCase().max(20).optional(),
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type Pagination = z.infer<typeof paginationSchema>;
