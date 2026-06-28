import { useQuery } from '@tanstack/react-query';
import { queryKeys, type ListParams } from '@/lib/queryKeys';
import { employeesApi } from './employeesApi';

export function useEmployees(companyId: string, params: ListParams) {
  return useQuery({
    queryKey: queryKeys.employees.list(companyId, params),
    queryFn: () => employeesApi.list(params),
    enabled: Boolean(companyId),
  });
}

export function useEmployee(companyId: string, id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employees.detail(companyId, id ?? ''),
    queryFn: () => employeesApi.get(id as string),
    enabled: Boolean(companyId && id),
  });
}
