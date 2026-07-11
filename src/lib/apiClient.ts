/**
 * Typed Axios client (CLAUDE.md §2) — the single HTTP entry point. Interceptors:
 *  - attach the JWT bearer token (tenant is encoded in the JWT),
 *  - attach the active company via `X-Company-Id` (D11),
 *  - normalise every error into an `ApiError` (RFC 7807 ProblemDetails),
 *  - on 401, clear the session and bounce to /login.
 *
 * React Query hooks call these `api.*` helpers; they never touch Axios directly.
 */
import axios, { type AxiosRequestConfig, type AxiosInstance } from 'axios';
import { COMPANY_HEADER } from './constants';
import { session } from './session';
import { ApiError } from './apiError';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/**
 * Dispatched when an authenticated request comes back 401 (token invalid/expired). AuthProvider
 * listens for it and drops the in-memory token so the router guard redirects to /login — clearing
 * localStorage alone doesn't update React state, so a stale token would otherwise linger until reload.
 */
export const AUTH_EXPIRED_EVENT = 'fp:auth-expired';

export const http: AxiosInstance = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = session.getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  // Company scope header — present on every call; tenant-wide endpoints simply ignore it.
  const companyId = session.getActiveCompanyId();
  if (companyId) {
    config.headers.set(COMPANY_HEADER, companyId);
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        return Promise.reject(ApiError.network(error.message));
      }
      const { status, data } = error.response;
      if (status === 401) {
        // Token invalid/expired — drop it. Only signal an expiry when we actually had a token
        // (so a failed login attempt on /login doesn't trigger a redirect loop).
        const hadToken = Boolean(session.getToken());
        session.clear();
        if (hadToken && typeof window !== 'undefined') {
          window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        }
      }
      const problem =
        data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
      return Promise.reject(ApiError.fromProblem(status, problem));
    }
    return Promise.reject(
      new ApiError({ status: 0, errorCode: 'UNKNOWN', message: 'Unexpected error' }),
    );
  },
);

/** Thin typed helpers over the Axios instance. */
export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await http.get<T>(url, config);
    return res.data;
  },
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await http.post<T>(url, body, config);
    return res.data;
  },
  put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await http.put<T>(url, body, config);
    return res.data;
  },
  patch: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await http.patch<T>(url, body, config);
    return res.data;
  },
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await http.delete<T>(url, config);
    return res.data;
  },
};
