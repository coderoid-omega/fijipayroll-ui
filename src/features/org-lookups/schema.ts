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

/** Optional code for the org-structure masters: blank/omitted is fine, but when given it must
 * follow the same rules as required codes (the `*` regex also lets the empty string through). */
const optionalCode = z
  .string()
  .trim()
  .max(20, 'Code is too long')
  .regex(/^[A-Za-z0-9_-]*$/, 'Use letters, numbers, dash or underscore only')
  .optional();

/** Division/Section/Grade/Level create/edit schema (company-scoped; name required, code optional). */
export const companyLookupWriteSchema = z.object({ code: optionalCode, name });
export type CompanyLookupFormValues = z.input<typeof companyLookupWriteSchema>;

// ---- Employee-config lookups (Sprint 2 Epic 1 — all tenant-wide, OQ-24) ----

const activeStatus = z.enum(['Active', 'Inactive']).optional();

/** Contract type create/edit schema (the legal basis of engagement, spec §5). */
export const contractTypeWriteSchema = z.object({
  code,
  name,
  isFixedTerm: z.boolean().optional(),
  status: activeStatus,
});
export type ContractTypeFormValues = z.input<typeof contractTypeWriteSchema>;

/** Employment stage create/edit schema (progression within an engagement, spec §5). */
export const employmentStageWriteSchema = z.object({
  code,
  name,
  ordinal: z.number().int().min(0, 'Ordinal must be 0 or more').optional(),
  isProbationary: z.boolean().optional(),
  status: activeStatus,
});
export type EmploymentStageFormValues = z.input<typeof employmentStageWriteSchema>;

/** Exit reason create/edit schema — the flags drive severance/notice behaviour (D10). */
export const exitReasonWriteSchema = z.object({
  code,
  name,
  initiator: z.enum(['Employee', 'Employer', 'Neither'], {
    errorMap: () => ({ message: 'Select who initiates this exit' }),
  }),
  severanceEligible: z.boolean().optional(),
  noticeRequired: z.boolean().optional(),
  rehireEligible: z.boolean().optional(),
  status: activeStatus,
});
export type ExitReasonFormValues = z.input<typeof exitReasonWriteSchema>;

/** Work-permit / relationship / document type create/edit schema (plain tenant-wide lookup). */
export const tenantConfigLookupWriteSchema = z.object({ code, name });
export type TenantConfigLookupFormValues = z.input<typeof tenantConfigLookupWriteSchema>;
