import { z } from 'zod';

export const userProfileSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
  picture: z.string().trim().url().optional(),
  provider: z.literal('local').optional(),
  focusGoal: z.string().trim().optional(),
  accentColor: z.string().trim().optional(),
  notificationsEnabled: z.boolean().optional().default(false),
  visualPreference: z.enum(['glass', 'minimal']).optional().default('glass'),
});

export const habitSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().trim().min(1),
  description: z.string().default(''),
  icon: z.string().default('check'),
  category: z.string().default('Geral'),
  frequency: z.enum(['daily', 'specific_days']),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  goalValue: z.string(),
  goalUnit: z.string().default('vez'),
  color: z.string().default('#7C3AED'),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export const checkInSchema = z.object({
  id: z.number().int().nonnegative(),
  habitId: z.number().int().nonnegative(),
  habitName: z.string().optional(),
  habitColor: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().nonnegative(),
  note: z.string().default(''),
  createdAt: z.string().datetime(),
});

export const syncStateSchema = z.object({
  user: userProfileSchema,
  habits: z.array(habitSchema).default([]),
  checkIns: z.array(checkInSchema).default([]),
});

export const syncRequestSchema = z.object({
  state: syncStateSchema,
});

export const credentialsSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,32}$/),
  password: z.string().min(8).max(128),
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(100),
});

export type SyncRequest = z.infer<typeof syncRequestSchema>;
