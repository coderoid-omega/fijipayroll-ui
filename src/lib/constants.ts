/** App-wide constants. Domain reference values come from ../Docs. */

export const APP_NAME = 'Fiji Payroll';

/** localStorage keys (namespaced). */
export const STORAGE_KEYS = {
  authToken: 'fp.auth.token',
  activeCompanyId: 'fp.active-company-id',
} as const;

/** HTTP header carrying the active company (brand) — D11. Tenant comes from the JWT. */
export const COMPANY_HEADER = 'X-Company-Id';

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
