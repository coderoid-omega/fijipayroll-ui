import { z } from 'zod';

/**
 * Company (brand) create/edit schema (Epic 2.2). Fields sourced from the desktop "Company
 * Details" form (FijiPayroll2025-Desktop-App-Dissection.md §2) and the contract's CompanyWrite.
 * `isPrimary` is intentionally absent — primary is set via the dedicated set-primary action (2.3).
 */

const optionalString = z
  .string()
  .trim()
  .max(200)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v === '' ? undefined : v));

const pct = z
  .number({ invalid_type_error: 'Must be a number' })
  .min(0, 'Cannot be negative')
  .max(100, 'Cannot exceed 100')
  .optional();

export const addressSchema = z.object({
  line1: optionalString,
  line2: optionalString,
  city: optionalString,
});

export const companyWriteSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(20, 'Code is too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, dash or underscore only'),
  name: z.string().trim().min(1, 'Name is required').max(200),
  legalName: optionalString,
  fnpfEmployerNo: optionalString,
  fnpfCheckDigit: z
    .string()
    .trim()
    .max(1, 'Check digit is a single character')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  tin: optionalString,
  address: addressSchema.optional(),
  defaultNormalPayCode: optionalString,
  defaultDirectorFeeCode: optionalString,
  defaultFnpfPayCode: optionalString,
  roundTo5cMode: z.enum(['None', 'CashOnly', 'All']).default('None'),
  employerFnpfPct: pct,
  employeeFnpfPct: pct,
  employerFnpfExcessExemptPct: pct,
  autoAddFnpfPayCode: z.boolean().default(true),
  enablePaydayReporting: z.boolean().default(true),
});

/** Parsed/output shape — what we send to the API (matches CompanyWrite). */
export type CompanyWriteParsed = z.output<typeof companyWriteSchema>;
/** Form input shape — what the AntD Form holds before parsing. */
export type CompanyFormValues = z.input<typeof companyWriteSchema>;
