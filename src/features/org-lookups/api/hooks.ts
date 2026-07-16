import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type {
  CompanyLookupWrite,
  ContractTypeWrite,
  DepartmentWrite,
  EmploymentStageWrite,
  ExitReasonWrite,
  LookupWrite,
  OfficeWrite,
} from '@/types/api';
import { orgApi, type CompanyLookupResource, type TenantConfigLookupResource } from './orgApi';

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

export function useCreateOffice(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OfficeWrite) => orgApi.createOffice(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.offices(companyId) }),
  });
}

export function useUpdateOffice(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: OfficeWrite }) => orgApi.updateOffice(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.offices(companyId) }),
  });
}

export function useCompanyLookups(resource: CompanyLookupResource, companyId: string) {
  return useQuery({
    queryKey: queryKeys.companyLookups(resource, companyId),
    queryFn: () => orgApi.listCompanyLookups(resource),
    enabled: Boolean(companyId),
  });
}

export function useCreateCompanyLookup(resource: CompanyLookupResource, companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CompanyLookupWrite) => orgApi.createCompanyLookup(resource, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.companyLookups(resource, companyId) }),
  });
}

export function useUpdateCompanyLookup(resource: CompanyLookupResource, companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CompanyLookupWrite }) =>
      orgApi.updateCompanyLookup(resource, id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.companyLookups(resource, companyId) }),
  });
}

export function useOccupations() {
  return useQuery({
    queryKey: queryKeys.occupations(),
    queryFn: () => orgApi.listOccupations(),
    staleTime: 60 * 60_000,
  });
}

export function useCreateOccupation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LookupWrite) => orgApi.createOccupation(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.occupations() }),
  });
}

export function useUpdateOccupation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: LookupWrite }) =>
      orgApi.updateOccupation(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.occupations() }),
  });
}

// ---- Employee-config lookups (Sprint 2 Epic 1) — tenant-wide, so hooks take no companyId ----

export function useContractTypes() {
  return useQuery({
    queryKey: queryKeys.contractTypes(),
    queryFn: () => orgApi.listContractTypes(),
    staleTime: 60 * 60_000,
  });
}

export function useCreateContractType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ContractTypeWrite) => orgApi.createContractType(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contractTypes() }),
  });
}

export function useUpdateContractType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ContractTypeWrite }) =>
      orgApi.updateContractType(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contractTypes() }),
  });
}

export function useEmploymentStages() {
  return useQuery({
    queryKey: queryKeys.employmentStages(),
    queryFn: () => orgApi.listEmploymentStages(),
    staleTime: 60 * 60_000,
  });
}

export function useCreateEmploymentStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmploymentStageWrite) => orgApi.createEmploymentStage(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.employmentStages() }),
  });
}

export function useUpdateEmploymentStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: EmploymentStageWrite }) =>
      orgApi.updateEmploymentStage(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.employmentStages() }),
  });
}

export function useExitReasons() {
  return useQuery({
    queryKey: queryKeys.exitReasons(),
    queryFn: () => orgApi.listExitReasons(),
    staleTime: 60 * 60_000,
  });
}

export function useCreateExitReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ExitReasonWrite) => orgApi.createExitReason(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.exitReasons() }),
  });
}

export function useUpdateExitReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ExitReasonWrite }) =>
      orgApi.updateExitReason(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.exitReasons() }),
  });
}

export function useTenantConfigLookups(resource: TenantConfigLookupResource) {
  return useQuery({
    queryKey: queryKeys.tenantConfigLookups(resource),
    queryFn: () => orgApi.listTenantConfigLookups(resource),
    staleTime: 60 * 60_000,
  });
}

export function useCreateTenantConfigLookup(resource: TenantConfigLookupResource) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LookupWrite) => orgApi.createTenantConfigLookup(resource, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tenantConfigLookups(resource) }),
  });
}

export function useUpdateTenantConfigLookup(resource: TenantConfigLookupResource) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: LookupWrite }) =>
      orgApi.updateTenantConfigLookup(resource, id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tenantConfigLookups(resource) }),
  });
}
