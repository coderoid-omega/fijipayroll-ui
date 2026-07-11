import { z } from 'zod';

const code = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(20, 'Code is too long')
  .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, dash or underscore only');
const name = z.string().trim().min(1, 'Name is required').max(120);

/** Department create/edit schema (Epic 5.2). */
export const departmentWriteSchema = z.object({
  code,
  name,
  parentDepartmentId: z.string().uuid().nullable().optional(),
});

export type DepartmentFormValues = z.input<typeof departmentWriteSchema>;

/** Office create/edit schema (company-scoped). */
export const officeWriteSchema = z.object({ code, name });
export type OfficeFormValues = z.input<typeof officeWriteSchema>;

/** Occupation create/edit schema (tenant-wide reference). */
export const occupationWriteSchema = z.object({ code, name });
export type OccupationFormValues = z.input<typeof occupationWriteSchema>;
