import { describe, it, expect } from 'vitest';
import { companyWriteSchema } from './schema';

describe('companyWriteSchema', () => {
  it('accepts a minimal valid company and applies defaults', () => {
    const result = companyWriteSchema.safeParse({ code: 'DEMO', name: 'Demo Company' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roundTo5cMode).toBe('None');
      expect(result.data.autoAddFnpfPayCode).toBe(true);
      expect(result.data.enablePaydayReporting).toBe(true);
    }
  });

  it('requires code and name', () => {
    const result = companyWriteSchema.safeParse({ code: '', name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid code characters', () => {
    const result = companyWriteSchema.safeParse({ code: 'bad code!', name: 'X' });
    expect(result.success).toBe(false);
  });

  it('limits the FNPF check digit to a single character', () => {
    const result = companyWriteSchema.safeParse({ code: 'A', name: 'X', fnpfCheckDigit: '12' });
    expect(result.success).toBe(false);
  });

  it('normalises empty optional strings to undefined', () => {
    const result = companyWriteSchema.safeParse({ code: 'A', name: 'X', tin: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tin).toBeUndefined();
  });

  it('rejects an FNPF percentage above 100', () => {
    const result = companyWriteSchema.safeParse({ code: 'A', name: 'X', employerFnpfPct: 150 });
    expect(result.success).toBe(false);
  });
});
