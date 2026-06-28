/**
 * FJD currency formatting — the single place currency is rendered (CLAUDE.md §5, §7).
 *
 * IMPORTANT: the backend is authoritative for all computed amounts. These helpers are for
 * DISPLAY only — never use them to derive payroll figures. Money values arriving from the API
 * are plain `number` (2dp); we format, we do not recompute.
 */
import type { Money } from '@/types/api';

export const CURRENCY_CODE = 'FJD';
export const CURRENCY_SYMBOL = 'FJ$';
const LOCALE = 'en-FJ';

const plainFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format an amount as FJD, e.g. `formatMoney(1234.5)` -> "FJ$1,234.50". The `FJ$` symbol is
 * applied explicitly (ICU renders FJD inconsistently across locales/runtimes) so display is stable.
 */
export function formatMoney(amount: Money | null | undefined, fallback = '—'): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return fallback;
  const sign = amount < 0 ? '-' : '';
  return `${sign}${CURRENCY_SYMBOL}${plainFormatter.format(Math.abs(amount))}`;
}

/** Format the number part only (no symbol), 2dp with thousands separators. */
export function formatAmount(amount: Money | null | undefined, fallback = '—'): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return fallback;
  return plainFormatter.format(amount);
}

/** Format a rate stored as a fraction (0.18) as a percentage string ("18%"). */
export function formatRate(fraction: number | null | undefined, fractionDigits = 0): string {
  if (fraction === null || fraction === undefined || Number.isNaN(fraction)) return '—';
  return `${(fraction * 100).toFixed(fractionDigits)}%`;
}

/** Format a percent stored as a whole number (8) as "8%". */
export function formatPercent(pct: number | null | undefined, fractionDigits = 0): string {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return '—';
  return `${pct.toFixed(fractionDigits)}%`;
}
