import { describe, it, expect } from 'vitest';
import { formatMoney, formatAmount, formatRate, formatPercent } from './money';

describe('formatMoney', () => {
  it('formats a positive amount as FJD with 2dp and thousands separators', () => {
    expect(formatMoney(1234.5)).toBe('FJ$1,234.50');
  });

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('FJ$0.00');
  });

  it('formats negatives', () => {
    expect(formatMoney(-50)).toBe('-FJ$50.00');
  });

  it('returns the fallback for nullish / NaN', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
    expect(formatMoney(Number.NaN)).toBe('—');
    expect(formatMoney(null, 'n/a')).toBe('n/a');
  });
});

describe('formatAmount', () => {
  it('formats without a currency symbol', () => {
    expect(formatAmount(1234.5)).toBe('1,234.50');
  });
});

describe('formatRate', () => {
  it('renders a fraction as a percentage', () => {
    expect(formatRate(0.18)).toBe('18%');
    expect(formatRate(0.135, 1)).toBe('13.5%');
    expect(formatRate(null)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('renders a whole-number percent', () => {
    expect(formatPercent(8)).toBe('8%');
    expect(formatPercent(10)).toBe('10%');
    expect(formatPercent(null)).toBe('—');
  });
});
