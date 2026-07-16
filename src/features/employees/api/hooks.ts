import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { queryKeys, type ListParams } from '@/lib/queryKeys';
import type {
  ContractType,
  EmployeeCreate,
  EmployeePatch,
  EmploymentStage,
  EnableLoginRequest,
  PayFrequency,
} from '@/types/api';
import { employeesApi } from './employeesApi';

// Reference data the employee forms need (contract types / stages / pay frequencies). Local hooks
// rather than imports from org-lookups/pay-calendar internals (CLAUDE.md §3: features never
// import from each other's internals); the central queryKeys keep the caches shared regardless.

export function useContractTypeOptions() {
  return useQuery({
    queryKey: queryKeys.contractTypes(),
    queryFn: () => api.get<ContractType[]>('/contract-types'),
    staleTime: 60 * 60_000,
  });
}

export function useEmploymentStageOptions() {
  return useQuery({
    queryKey: queryKeys.employmentStages(),
    queryFn: () => api.get<EmploymentStage[]>('/employment-stages'),
    staleTime: 60 * 60_000,
  });
}

export function usePayFrequencyOptions(companyId: string) {
  return useQuery({
    queryKey: queryKeys.payFrequencies(companyId),
    queryFn: () => api.get<PayFrequency[]>('/pay-frequencies'),
    enabled: Boolean(companyId),
  });
}

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

export function useCreateEmployee(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmployeeCreate) => employeesApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.employees.all(companyId) }),
  });
}

export function usePatchEmployee(companyId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmployeePatch) => employeesApi.patch(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.employees.detail(companyId, id), updated);
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all(companyId) });
    },
  });
}

export function useEnableLogin(companyId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: EnableLoginRequest) => employeesApi.enableLogin(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.employees.detail(companyId, id), updated);
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all(companyId) });
    },
  });
}
