import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
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
