import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { payCalendarApi } from './payCalendarApi';

export function usePayFrequencies(companyId: string) {
  return useQuery({
    queryKey: queryKeys.payFrequencies(companyId),
    queryFn: () => payCalendarApi.listFrequencies(),
    enabled: Boolean(companyId),
  });
}

export function usePayPeriods(
  companyId: string,
  params: { payYear?: number; payFrequencyId?: string },
) {
  return useQuery({
    queryKey: queryKeys.payPeriods(companyId, params),
    queryFn: () => payCalendarApi.listPeriods(params),
    enabled: Boolean(companyId),
  });
}
