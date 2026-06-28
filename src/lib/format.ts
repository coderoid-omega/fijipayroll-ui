/** Misc display formatters that aren't money- or date-specific. */

/** Title-case a token: "DirectDeposit" / "direct_deposit" -> "Direct Deposit". */
export function humanize(value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Build display initials from a name, e.g. "Sefanaia Naivalu" -> "SN". */
export function initials(name: string | null | undefined, max = 2): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, max)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Truncate with an ellipsis. */
export function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}
