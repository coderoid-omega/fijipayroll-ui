import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, toApiDate, fromApiDate } from './date';

describe('formatDate', () => {
  it('formats an ISO date as DD-MM-YYYY', () => {
    expect(formatDate('2026-06-28')).toBe('28-06-2026');
  });

  it('returns the fallback for nullish / invalid', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('formats an ISO timestamp', () => {
    expect(formatDateTime('2026-06-28T09:05:00Z')).toMatch(/^28-06-2026 \d{2}:\d{2}$/);
  });
});

describe('toApiDate / fromApiDate round-trip', () => {
  it('round-trips a wire date through Dayjs', () => {
    const d = fromApiDate('2026-06-28');
    expect(d).not.toBeNull();
    expect(toApiDate(d)).toBe('2026-06-28');
  });

  it('returns null for nullish input', () => {
    expect(toApiDate(null)).toBeNull();
    expect(fromApiDate(null)).toBeNull();
  });
});
