import { z } from 'zod';

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be at most 50 characters')
  .refine((s) => !/\s/.test(s), 'Name must not contain spaces');

const passwordSchema = z.string().min(4, 'Password must be at least 4 characters');

const emailSchema = z.string().email().optional().or(z.literal(''));

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Phone must be E.164 format')
  .optional()
  .or(z.literal(''));

export const registerBodySchema = z.object({
  name: nameSchema,
  password: passwordSchema,
  email: emailSchema.transform((v) => (v === '' ? undefined : v)),
  phone: phoneSchema.transform((v) => (v === '' ? undefined : v)),
});

export const loginBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
