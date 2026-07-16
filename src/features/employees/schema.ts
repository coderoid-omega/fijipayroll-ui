import { z } from 'zod';

const code = z
  .string()
  .trim()
  .max(20, 'Code is too long')
  .regex(/^[A-Za-z0-9_-]*$/, 'Use letters, numbers, dash or underscore only');
const requiredName = (label: string) => z.string().trim().min(1, `${label} is required`).max(100);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date');

/**
 * Onboarding schema — the contract's `EmployeeCreate` minimal required core (OQ-04).
 * TIN / FNPF number FORMAT is deliberately not validated (no spec exists — a guessed rule would
 * reject valid employees); the server enforces the same policy.
 */
export const employeeCreateSchema = z
  .object({
    employeeCode: code.optional().or(z.literal('')),
    firstName: requiredName('First name'),
    lastName: requiredName('Last name'),
    contractTypeId: z.string().uuid({ message: 'Contract type is required' }),
    stageId: z.string().uuid().optional().nullable(),
    dateOfHire: isoDate,
    payType: z.enum(['Salary', 'Hourly']),
    hourlyRate: z.number().positive('Rate must be positive').optional().nullable(),
    salaryPerPeriod: z.number().positive('Salary must be positive').optional().nullable(),
    payFrequencyId: z.string().uuid().optional().nullable(),
    taxCode: z.enum(['P', 'S', 'None']),
    tin: z.string().trim().max(50).optional().or(z.literal('')),
    fnpfNo: z.string().trim().max(50).optional().or(z.literal('')),
    dateOfBirth: isoDate.optional().nullable(),
  })
  .superRefine((v, ctx) => {
    // Cross-field (mirrors the API): the rate matching the pay type is required.
    if (v.payType === 'Hourly' && v.hourlyRate == null)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hourlyRate'], message: 'Hourly rate is required' });
    if (v.payType === 'Salary' && v.salaryPerPeriod == null)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salaryPerPeriod'], message: 'Salary per period is required' });
  });

export type EmployeeCreateFormValues = z.input<typeof employeeCreateSchema>;
