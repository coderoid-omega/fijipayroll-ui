/**
 * Framework-agnostic accessors for the auth token and active company id, backed by
 * localStorage. The React providers (AuthProvider, TenantCompanyProvider) keep their state in
 * sync with these, but the Axios interceptors read them here so the HTTP layer needs no React.
 */
import { STORAGE_KEYS } from './constants';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode / SSR) — non-fatal */
  }
}

export const session = {
  getToken: () => read(STORAGE_KEYS.authToken),
  setToken: (token: string | null) => write(STORAGE_KEYS.authToken, token),

  getActiveCompanyId: () => read(STORAGE_KEYS.activeCompanyId),
  setActiveCompanyId: (id: string | null) => write(STORAGE_KEYS.activeCompanyId, id),

  // Device preference, not auth state — deliberately NOT wiped by clear()/logout.
  getThemeMode: () => read(STORAGE_KEYS.themeMode),
  setThemeMode: (mode: string) => write(STORAGE_KEYS.themeMode, mode),

  clear: () => {
    write(STORAGE_KEYS.authToken, null);
    write(STORAGE_KEYS.activeCompanyId, null);
  },
};
