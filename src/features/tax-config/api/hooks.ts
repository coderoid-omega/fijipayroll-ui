import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { FnpfSchemeWrite, TaxRuleSetWrite } from '@/types/api';
import { taxConfigApi } from './taxConfigApi';

/** Statutory config is reference data — cache generously. */
const STATUTORY_STALE = 60 * 60_000;

export function useTaxRuleSets(asOfDate?: string) {
  return useQuery({
    queryKey: queryKeys.taxRuleSets.list(asOfDate),
    queryFn: () => taxConfigApi.listTaxRuleSets(asOfDate),
    staleTime: STATUTORY_STALE,
  });
}

export function useTaxRuleSet(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.taxRuleSets.detail(id ?? ''),
    queryFn: () => taxConfigApi.getTaxRuleSet(id as string),
    enabled: Boolean(id),
    staleTime: STATUTORY_STALE,
  });
}

export function useFnpfSchemes(asOfDate?: string) {
  return useQuery({
    queryKey: queryKeys.fnpfSchemes.list(asOfDate),
    queryFn: () => taxConfigApi.listFnpfSchemes(asOfDate),
    staleTime: STATUTORY_STALE,
  });
}

export function useCreateTaxRuleSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TaxRuleSetWrite) => taxConfigApi.createTaxRuleSet(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.taxRuleSets.all() }),
  });
}

export function useUpdateTaxRuleSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TaxRuleSetWrite }) =>
      taxConfigApi.updateTaxRuleSet(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.taxRuleSets.all() }),
  });
}

export function useCreateFnpfScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: FnpfSchemeWrite) => taxConfigApi.createFnpfScheme(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.fnpfSchemes.all() }),
  });
}

export function useUpdateFnpfScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: FnpfSchemeWrite }) =>
      taxConfigApi.updateFnpfScheme(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.fnpfSchemes.all() }),
  });
}
