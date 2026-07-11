import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, AUTH_EXPIRED_EVENT } from '@/lib/apiClient';
import { session } from '@/lib/session';
import { queryKeys } from '@/lib/queryKeys';
import type { LoginRequest, LoginResponse, Me } from '@/types/api';
import { AuthContext, type AuthContextValue } from './AuthContext';

/**
 * Owns authentication state: holds the JWT (via `session`/localStorage), fetches `/me` once a
 * token is present, and exposes login/logout. Tenant identity rides in the JWT; the active
 * company is handled separately by TenantCompanyProvider (D11).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => session.getToken());

  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => api.get<Me>('/me'),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });

  const login = useCallback(
    async (loginCode: string, password: string) => {
      const res = await api.post<LoginResponse>('/auth/login', {
        loginCode,
        password,
      } satisfies LoginRequest);
      session.setToken(res.accessToken);
      setToken(res.accessToken);
      // Prime /me immediately so the shell has the user/companies on first paint.
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    session.clear();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  // A 401 on any authenticated request (expired/invalid token) drops us back to the login screen.
  // The interceptor already cleared the session; here we clear the in-memory token so the guard runs.
  useEffect(() => {
    const onExpired = () => {
      setToken(null);
      queryClient.clear();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      me: meQuery.data ?? null,
      isAuthenticated: Boolean(token),
      isLoading: Boolean(token) && meQuery.isLoading,
      login,
      logout,
    }),
    [token, meQuery.data, meQuery.isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
