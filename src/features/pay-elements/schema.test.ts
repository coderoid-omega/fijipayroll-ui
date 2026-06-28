import { describe, it, expect } from 'vitest';
import { payElementWriteSchema } from './schema';

const base = {
  code: '101',
  description: 'Regular',
  payGroupCode: 'PY',
  calcType: 'Hour',
  validFrom: '2026-01-01',
};

describe('payElementWriteSchema', () => {
  it('accepts a valid element and defaults the flags', () => {
    const result = payElementWriteSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.eRate).toBe(1);
      expect(result.data.isPayeAble).toBe(true);
      expect(result.data.isOneTimeForTax).toBe(false);
      expect(result.data.showOnPayslip).toBe(true);
    }
  });

  it('requires an effective-from date', () => {
    const result = payElementWriteSchema.safeParse({ ...base, validFrom: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid pay group', () => {
    const result = payElementWriteSchema.safeParse({ ...base, payGroupCode: 'ZZ' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid calc type', () => {
    const result = payElementWriteSchema.safeParse({ ...base, calcType: 'Hourly' });
    expect(result.success).toBe(false);
  });

  it('caps quick-entry column at 10', () => {
    const result = payElementWriteSchema.safeParse({ ...base, quickEntryColumnNo: 11 });
    expect(result.success).toBe(false);
  });

  it('keeps a multiplier E-Rate like 1.5', () => {
    const result = payElementWriteSchema.safeParse({ ...base, calcType: 'Multiplier', eRate: 1.5 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.eRate).toBe(1.5);
  });
});
