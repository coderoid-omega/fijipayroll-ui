import { describe, it, expect } from 'vitest';
import { fnpfSchemeWriteSchema, taxRuleSetWriteSchema } from './schema';

describe('fnpfSchemeWriteSchema', () => {
  const base = { validFrom: '2027-01-01', employeePct: 8, employerPct: 10, employerExcessExemptPct: 10 };

  it('accepts a valid scheme and defaults voluntary % + status', () => {
    const result = fnpfSchemeWriteSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.voluntaryPct).toBe(0);
      expect(result.data.status).toBe('Active');
    }
  });

  it('requires an effective-from date', () => {
    expect(fnpfSchemeWriteSchema.safeParse({ ...base, validFrom: '' }).success).toBe(false);
  });

  it('rejects a percentage above 100', () => {
    expect(fnpfSchemeWriteSchema.safeParse({ ...base, employerPct: 120 }).success).toBe(false);
  });
});

describe('taxRuleSetWriteSchema', () => {
  const bracket = {
    taxType: 'Resident' as const,
    levy: 'PAYE' as const,
    lowerBound: 30000,
    upperBound: 50000,
    baseAmount: 0,
    marginalRate: 0.18,
    ordinal: 1,
  };

  it('accepts a rule set with at least one bracket', () => {
    const result = taxRuleSetWriteSchema.safeParse({
      code: 'FJ-STAT-2027.1',
      validFrom: '2027-01-01',
      brackets: [bracket],
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one bracket', () => {
    const result = taxRuleSetWriteSchema.safeParse({
      code: 'FJ-STAT-2027.1',
      validFrom: '2027-01-01',
      brackets: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a marginal rate above 1 (must be a fraction)', () => {
    const result = taxRuleSetWriteSchema.safeParse({
      code: 'X',
      validFrom: '2027-01-01',
      brackets: [{ ...bracket, marginalRate: 18 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an upper bound below the lower bound', () => {
    const result = taxRuleSetWriteSchema.safeParse({
      code: 'X',
      validFrom: '2027-01-01',
      brackets: [{ ...bracket, lowerBound: 50000, upperBound: 30000 }],
    });
    expect(result.success).toBe(false);
  });
});
