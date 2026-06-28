import { createContext, useContext } from 'react';
import type { MeCompany } from '@/types/api';

export interface TenantCompanyContextValue {
  tenant: { id: string; name: string } | null;
  companies: MeCompany[];
  activeCompanyId: string | null;
  activeCompany: MeCompany | null;
  setActiveCompany: (companyId: string) => void;
}

export const TenantCompanyContext = createContext<TenantCompanyContextValue | null>(null);

export function useTenantCompany(): TenantCompanyContextValue {
  const ctx = useContext(TenantCompanyContext);
  if (!ctx) throw new Error('useTenantCompany must be used within <TenantCompanyProvider>');
  return ctx;
}
