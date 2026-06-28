/**
 * Date helpers — Fiji convention is DD-MM-YYYY for display (CLAUDE.md §5).
 * The API exchanges ISO dates (`YYYY-MM-DD`) and RFC 3339 timestamps; we convert at the edge.
 */
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const DISPLAY_DATE_FORMAT = 'DD-MM-YYYY';
export const DISPLAY_DATETIME_FORMAT = 'DD-MM-YYYY HH:mm';
/** Wire format for business dates exchanged with the API. */
export const API_DATE_FORMAT = 'YYYY-MM-DD';

/** Format an ISO date / date-time string for display as DD-MM-YYYY. */
export function formatDate(value: string | Dayjs | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  const d = dayjs(value);
  return d.isValid() ? d.format(DISPLAY_DATE_FORMAT) : fallback;
}

/** Format an ISO timestamp for display as DD-MM-YYYY HH:mm. */
export function formatDateTime(value: string | Dayjs | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  const d = dayjs(value);
  return d.isValid() ? d.format(DISPLAY_DATETIME_FORMAT) : fallback;
}

/** Convert a Dayjs (e.g. from an AntD DatePicker) to the API wire date `YYYY-MM-DD`. */
export function toApiDate(value: Dayjs | null | undefined): string | null {
  if (!value || !value.isValid()) return null;
  return value.format(API_DATE_FORMAT);
}

/** Parse an API date string into a Dayjs for AntD form controls. */
export function fromApiDate(value: string | null | undefined): Dayjs | null {
  if (!value) return null;
  const d = dayjs(value, API_DATE_FORMAT);
  return d.isValid() ? d : dayjs(value);
}

export { dayjs };
