import { api } from '@/lib/apiClient';
import type { FnpfScheme, TaxRuleSet } from '@/types/api';

/**
 * Statutory config API (tenant-wide, read-only in Sprint 1 — the contract exposes GET only).
 * Tax rule sets and FNPF schemes are effective-dated; history is immutable.
 */
export const taxConfigApi = {
  listTaxRuleSets: (asOfDate?: string) =>
    api.get<TaxRuleSet[]>('/tax-rule-sets', {
      params: asOfDate ? { asOfDate } : undefined,
    }),

  getTaxRuleSet: (id: string) => api.get<TaxRuleSet>(`/tax-rule-sets/${id}`),

  listFnpfSchemes: (asOfDate?: string) =>
    api.get<FnpfScheme[]>('/fnpf-schemes', {
      params: asOfDate ? { asOfDate } : undefined,
    }),
};
