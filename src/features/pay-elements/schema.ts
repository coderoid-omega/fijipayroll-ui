import { z } from 'zod';
import { PAY_GROUP_CODES } from '@/types/api';

/**
 * Pay element (pay code) create/edit schema (Epic 3.3). Mirrors the contract's PayElementWrite and
 * the desktop "Update Pay Code" form: Group, Type, E-Rate multiplier, tax-treatment flags
 * (PAYE-able / FNPF-able / one-time-for-tax / pre- & post-tax), goal-amount, effective-from.
 * Tax treatment as data-driven flags is the configurability requirement (D10).
 */
export const payElementWriteSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(20, 'Code is too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, dash or underscore only'),
  description: z.string().trim().min(1, 'Description is required').max(200),
  payGroupCode: z.enum(PAY_GROUP_CODES, {
    errorMap: () => ({ message: 'Pay group is required' }),
  }),
  calcType: z.enum(['Hour', 'Dollar', 'Percent', 'Multiplier'], {
    errorMap: () => ({ message: 'Type is required' }),
  }),
  eRate: z
    .number({ invalid_type_error: 'E-Rate must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Unreasonably large')
    .default(1),
  isPayeAble: z.boolean().default(true),
  isFnpfAble: z.boolean().default(true),
  isOneTimeForTax: z.boolean().default(false),
  isPreTax: z.boolean().default(false),
  isPostTax: z.boolean().default(false),
  showOnPayslip: z.boolean().default(true),
  hasGoalAmount: z.boolean().default(false),
  quickEntryColumnNo: z
    .number({ invalid_type_error: 'Must be a number' })
    .int('Whole number only')
    .min(0)
    .max(10, 'Max 10 inline columns')
    .nullable()
    .optional(),
  validFrom: z.string().min(1, 'Effective-from date is required'),
});

export type PayElementWriteParsed = z.output<typeof payElementWriteSchema>;
export type PayElementFormValues = z.input<typeof payElementWriteSchema>;
