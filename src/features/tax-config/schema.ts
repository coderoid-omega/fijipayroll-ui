import { z } from 'zod';

/** Zod schemas for statutory write payloads (Epic 4 editable). */

const pctRequired = z
  .number({ invalid_type_error: 'Required' })
  .min(0, 'Cannot be negative')
  .max(100, 'Cannot exceed 100');

export const fnpfSchemeWriteSchema = z.object({
  validFrom: z.string().min(1, 'Effective-from date is required'),
  employeePct: pctRequired,
  employerPct: pctRequired,
  voluntaryPct: pctRequired.default(0),
  employerExcessExemptPct: pctRequired,
  wageCeiling: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .nullable()
    .optional(),
  status: z.enum(['Draft', 'Active']).default('Active'),
});

export type FnpfSchemeFormParsed = z.output<typeof fnpfSchemeWriteSchema>;

export const taxBracketWriteSchema = z
  .object({
    taxType: z.enum(['Resident', 'NonResident']),
    levy: z.enum(['PAYE', 'SRT', 'ECAL']),
    lowerBound: z.number({ invalid_type_error: 'Required' }).min(0, 'Cannot be negative'),
    upperBound: z
      .number({ invalid_type_error: 'Must be a number' })
      .min(0)
      .nullable()
      .optional(),
    baseAmount: z.number({ invalid_type_error: 'Required' }).min(0).default(0),
    marginalRate: z
      .number({ invalid_type_error: 'Required' })
      .min(0, 'Cannot be negative')
      .max(1, 'Rate is a fraction (e.g. 0.18)'),
    ordinal: z.number().int().min(1),
  })
  .refine((b) => b.upperBound == null || b.upperBound > b.lowerBound, {
    message: 'Upper bound must be greater than lower bound',
    path: ['upperBound'],
  });

export const taxRuleSetWriteSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(40)
    .regex(/^[A-Za-z0-9._-]+$/, 'Use letters, numbers, dot, dash or underscore only'),
  description: z.string().trim().max(300).nullable().optional(),
  validFrom: z.string().min(1, 'Effective-from date is required'),
  status: z.enum(['Draft', 'Active']).default('Active'),
  brackets: z.array(taxBracketWriteSchema).min(1, 'At least one bracket is required'),
});

export type TaxRuleSetFormParsed = z.output<typeof taxRuleSetWriteSchema>;
