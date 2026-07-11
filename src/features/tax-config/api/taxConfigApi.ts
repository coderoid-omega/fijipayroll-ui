import { api } from '@/lib/apiClient';
import type {
  FnpfScheme,
  FnpfSchemeWrite,
  TaxRuleSet,
  TaxRuleSetWrite,
} from '@/types/api';

/**
 * Statutory config API (tenant-wide, effective-dated). Writes require the `statutory.write`
 * permission; activating a new version supersedes the prior one (history stays immutable).
 */
export const taxConfigApi = {
  listTaxRuleSets: (asOfDate?: string) =>
    api.get<TaxRuleSet[]>('/tax-rule-sets', {
      params: asOfDate ? { asOfDate } : undefined,
    }),

  getTaxRuleSet: (id: string) => api.get<TaxRuleSet>(`/tax-rule-sets/${id}`),

  createTaxRuleSet: (body: TaxRuleSetWrite) => api.post<TaxRuleSet>('/tax-rule-sets', body),

  updateTaxRuleSet: (id: string, body: TaxRuleSetWrite) =>
    api.put<TaxRuleSet>(`/tax-rule-sets/${id}`, body),

  listFnpfSchemes: (asOfDate?: string) =>
    api.get<FnpfScheme[]>('/fnpf-schemes', {
      params: asOfDate ? { asOfDate } : undefined,
    }),

  createFnpfScheme: (body: FnpfSchemeWrite) => api.post<FnpfScheme>('/fnpf-schemes', body),

  updateFnpfScheme: (id: string, body: FnpfSchemeWrite) =>
    api.put<FnpfScheme>(`/fnpf-schemes/${id}`, body),
};
