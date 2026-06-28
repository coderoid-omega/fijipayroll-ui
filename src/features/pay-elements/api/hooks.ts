import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type ListParams } from '@/lib/queryKeys';
import type { PayElementWrite } from '@/types/api';
import { payElementsApi } from './payElementsApi';

/** The 14 pay groups — seeded reference data (Epic 3.1), tenant-wide. */
export function usePayGroups() {
  return useQuery({
    queryKey: queryKeys.payGroups(),
    queryFn: () => payElementsApi.groups(),
    staleTime: 60 * 60_000, // reference data; rarely changes
  });
}

/** Paged, company-scoped pay element list (Epic 3.2). Keyed on companyId so company switches refetch. */
export function usePayElements(
  companyId: string,
  params: ListParams & { payGroupCode?: string },
) {
  return useQuery({
    queryKey: queryKeys.payElements.list(companyId, params),
    queryFn: () => payElementsApi.list(params),
    enabled: Boolean(companyId),
  });
}

export function usePayElement(companyId: string, id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.payElements.detail(companyId, id ?? ''),
    queryFn: () => payElementsApi.get(id as string),
    enabled: Boolean(companyId && id),
  });
}

export function useCreatePayElement(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PayElementWrite) => payElementsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payElements.all(companyId) });
    },
  });
}

export function useUpdatePayElement(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PayElementWrite }) =>
      payElementsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payElements.all(companyId) });
    },
  });
}
