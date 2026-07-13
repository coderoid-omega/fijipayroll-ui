import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { session } from '@/lib/session';
import { useAuth } from './AuthContext';
import { TenantCompanyContext, type TenantCompanyContextValue } from './TenantCompanyContext';

/**
 * Holds the active company (brand) within the tenant (D11). The selected `companyId` is sent on
 * every API call via `session` -> X-Company-Id header. Defaults to the last-selected company
 * (localStorage), falling back to the tenant's primary. Changing it invalidates all
 * company-scoped queries so lists refetch for the new company.
 */
export function TenantCompanyProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const companies = useMemo(() => me?.companies ?? [], [me]);

  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() =>
    session.getActiveCompanyId(),
  );

  // Once companies load, ensure the active id is valid; otherwise pick primary (or first).
  useEffect(() => {
    if (companies.length === 0) return;
    const stillValid = activeCompanyId && companies.some((c) => c.id === activeCompanyId);
    if (stillValid) {
      // Re-write storage: a 401 clears it (session.clear) while this provider's in-memory state
      // survives re-login, and the Axios interceptor reads the header value from storage.
      session.setActiveCompanyId(activeCompanyId);
      return;
    }
    const fallback = companies.find((c) => c.isPrimary) ?? companies[0];
    if (fallback) {
      setActiveCompanyId(fallback.id);
      session.setActiveCompanyId(fallback.id);
    }
  }, [companies, activeCompanyId]);

  const setActiveCompany = useCallback(
    (companyId: string) => {
      if (companyId === activeCompanyId) return;
      setActiveCompanyId(companyId);
      session.setActiveCompanyId(companyId);
      // Drop company-scoped caches so everything refetches under the new company header.
      queryClient.invalidateQueries();
    },
    [activeCompanyId, queryClient],
  );

  const value = useMemo<TenantCompanyContextValue>(
    () => ({
      tenant: me?.tenant ?? null,
      companies,
      activeCompanyId,
      activeCompany: companies.find((c) => c.id === activeCompanyId) ?? null,
      setActiveCompany,
    }),
    [me, companies, activeCompanyId, setActiveCompany],
  );

  return (
    <TenantCompanyContext.Provider value={value}>{children}</TenantCompanyContext.Provider>
  );
}
