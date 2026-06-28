import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type ListParams } from '@/lib/queryKeys';
import type { CompanyWrite } from '@/types/api';
import { companiesApi } from './companiesApi';

/** Paged company list (Epic 2.1). Companies are tenant-scoped, not company-scoped. */
export function useCompanies(params: ListParams) {
  return useQuery({
    queryKey: queryKeys.companies.list(params),
    queryFn: () => companiesApi.list(params),
  });
}

/** Single company, e.g. to hydrate the edit drawer. */
export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id ?? ''),
    queryFn: () => companiesApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CompanyWrite) => companiesApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.all() });
    },
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CompanyWrite }) =>
      companiesApi.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.all() });
      qc.invalidateQueries({ queryKey: queryKeys.companies.detail(id) });
    },
  });
}

export function useSetPrimaryCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companiesApi.setPrimary(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.all() });
      // /me carries the companies + isPrimary used by the Topbar switcher — refresh it.
      qc.invalidateQueries({ queryKey: queryKeys.me() });
    },
  });
}
