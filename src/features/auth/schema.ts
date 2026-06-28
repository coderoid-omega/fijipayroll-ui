import { z } from 'zod';

/** Login form schema (CLAUDE.md §6 — login is by loginCode, NOT email). */
export const loginSchema = z.object({
  loginCode: z.string().min(1, 'Login code is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
