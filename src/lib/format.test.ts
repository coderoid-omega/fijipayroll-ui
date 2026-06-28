import { describe, it, expect } from 'vitest';
import { humanize, initials, truncate } from './format';

describe('humanize', () => {
  it('splits PascalCase', () => {
    expect(humanize('DirectDeposit')).toBe('Direct Deposit');
  });
  it('splits snake/kebab case', () => {
    expect(humanize('pre_tax')).toBe('Pre Tax');
    expect(humanize('non-resident')).toBe('Non Resident');
  });
  it('falls back for nullish', () => {
    expect(humanize(null)).toBe('—');
  });
});

describe('initials', () => {
  it('takes the first letters of the first two words', () => {
    expect(initials('Sefanaia Naivalu')).toBe('SN');
  });
  it('handles a single name', () => {
    expect(initials('Demo')).toBe('D');
  });
  it('falls back to ? when empty', () => {
    expect(initials('')).toBe('?');
  });
});

describe('truncate', () => {
  it('truncates with an ellipsis', () => {
    expect(truncate('abcdefgh', 5)).toBe('abcd…');
  });
  it('leaves short strings alone', () => {
    expect(truncate('abc', 5)).toBe('abc');
  });
});
