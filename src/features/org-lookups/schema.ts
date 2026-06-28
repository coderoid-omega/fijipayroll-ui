import { z } from 'zod';

/** Department create/edit schema (Epic 5.2). */
export const departmentWriteSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(20, 'Code is too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, dash or underscore only'),
  name: z.string().trim().min(1, 'Name is required').max(120),
  parentDepartmentId: z.string().uuid().nullable().optional(),
});

export type DepartmentFormValues = z.input<typeof departmentWriteSchema>;
