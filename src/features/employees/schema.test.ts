import { describe, it, expect } from 'vitest';
import { employeeCreateSchema } from './schema';

const core = {
  firstName: 'Ana',
  lastName: 'Rokotui',
  contractTypeId: '019f6ac0-4fa5-7d74-a765-487fa85c62f3',
  dateOfHire: '2026-07-01',
  payType: 'Salary' as const,
  salaryPerPeriod: 2500,
  taxCode: 'S' as const,
};

describe('employeeCreateSchema (Sprint 2 Epic 2 — minimal required core, OQ-04)', () => {
  it('accepts the minimal core (employeeCode omitted → server allocates)', () => {
    expect(employeeCreateSchema.safeParse(core).success).toBe(true);
  });

  it('requires the matching rate for the pay type', () => {
    expect(employeeCreateSchema.safeParse({ ...core, salaryPerPeriod: undefined }).success).toBe(false);
    expect(
      employeeCreateSchema.safeParse({ ...core, payType: 'Hourly', salaryPerPeriod: undefined, hourlyRate: 8.5 }).success,
    ).toBe(true);
    expect(
      employeeCreateSchema.safeParse({ ...core, payType: 'Hourly', salaryPerPeriod: undefined }).success,
    ).toBe(false);
  });

  it('rejects a malformed manual code but accepts a blank one', () => {
    expect(employeeCreateSchema.safeParse({ ...core, employeeCode: 'has space' }).success).toBe(false);
    expect(employeeCreateSchema.safeParse({ ...core, employeeCode: '' }).success).toBe(true);
  });

  it('does NOT validate TIN/FNPF format (no spec exists — see brief §7)', () => {
    expect(employeeCreateSchema.safeParse({ ...core, tin: 'anything-goes-here', fnpfNo: '###' }).success).toBe(true);
  });
});
