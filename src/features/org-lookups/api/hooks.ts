import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { DepartmentWrite } from '@/types/api';
import { orgApi } from './orgApi';

export function useDepartments(companyId: string) {
  return useQuery({
    queryKey: queryKeys.departments(companyId),
    queryFn: () => orgApi.listDepartments(),
    enabled: Boolean(companyId),
  });
}

export function useCreateDepartment(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DepartmentWrite) => orgApi.createDepartment(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departments(companyId) }),
  });
}

export function useUpdateDepartment(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DepartmentWrite }) =>
      orgApi.updateDepartment(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departments(companyId) }),
  });
}

export function useOffices(companyId: string) {
  return useQuery({
    queryKey: queryKeys.offices(companyId),
    queryFn: () => orgApi.listOffices(),
    enabled: Boolean(companyId),
  });
}

export function useOccupations() {
  return useQuery({
    queryKey: queryKeys.occupations(),
    queryFn: () => orgApi.listOccupations(),
    staleTime: 60 * 60_000,
  });
}
