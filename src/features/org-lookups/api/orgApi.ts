import { api } from '@/lib/apiClient';
import type {
  CompanyLookup,
  CompanyLookupWrite,
  ContractType,
  ContractTypeWrite,
  Department,
  DepartmentWrite,
  EmploymentStage,
  EmploymentStageWrite,
  ExitReason,
  ExitReasonWrite,
  Lookup,
  LookupWrite,
  Office,
  OfficeWrite,
} from '@/types/api';

/** The four company-scoped org-structure masters, all sharing the CompanyLookup shape. */
export type CompanyLookupResource = 'divisions' | 'sections' | 'grades' | 'levels';

/** The three simple tenant-wide employee-config lookups (Epic 1), sharing the Lookup shape. */
export type TenantConfigLookupResource =
  | 'work-permit-types'
  | 'relationship-types'
  | 'document-types';

/**
 * Org lookups API. Departments, offices and the org-structure masters (divisions/sections/
 * grades/levels) are company-scoped (header); occupations are tenant-wide. All support
 * create/update.
 */
export const orgApi = {
  listDepartments: () => api.get<Department[]>('/departments'),
  createDepartment: (body: DepartmentWrite) => api.post<Department>('/departments', body),
  updateDepartment: (id: string, body: DepartmentWrite) =>
    api.put<Department>(`/departments/${id}`, body),

  listOffices: () => api.get<Office[]>('/offices'),
  createOffice: (body: OfficeWrite) => api.post<Office>('/offices', body),
  updateOffice: (id: string, body: OfficeWrite) => api.put<Office>(`/offices/${id}`, body),

  listCompanyLookups: (resource: CompanyLookupResource) =>
    api.get<CompanyLookup[]>(`/${resource}`),
  createCompanyLookup: (resource: CompanyLookupResource, body: CompanyLookupWrite) =>
    api.post<CompanyLookup>(`/${resource}`, body),
  updateCompanyLookup: (resource: CompanyLookupResource, id: string, body: CompanyLookupWrite) =>
    api.put<CompanyLookup>(`/${resource}/${id}`, body),

  listOccupations: () => api.get<Lookup[]>('/occupations'),
  createOccupation: (body: LookupWrite) => api.post<Lookup>('/occupations', body),
  updateOccupation: (id: string, body: LookupWrite) =>
    api.put<Lookup>(`/occupations/${id}`, body),

  // Employee-config lookups (Sprint 2 Epic 1) — ALL tenant-wide (OQ-24): no X-Company-Id.
  listContractTypes: () => api.get<ContractType[]>('/contract-types'),
  createContractType: (body: ContractTypeWrite) => api.post<ContractType>('/contract-types', body),
  updateContractType: (id: string, body: ContractTypeWrite) =>
    api.put<ContractType>(`/contract-types/${id}`, body),

  listEmploymentStages: () => api.get<EmploymentStage[]>('/employment-stages'),
  createEmploymentStage: (body: EmploymentStageWrite) =>
    api.post<EmploymentStage>('/employment-stages', body),
  updateEmploymentStage: (id: string, body: EmploymentStageWrite) =>
    api.put<EmploymentStage>(`/employment-stages/${id}`, body),

  listExitReasons: () => api.get<ExitReason[]>('/exit-reasons'),
  createExitReason: (body: ExitReasonWrite) => api.post<ExitReason>('/exit-reasons', body),
  updateExitReason: (id: string, body: ExitReasonWrite) =>
    api.put<ExitReason>(`/exit-reasons/${id}`, body),

  listTenantConfigLookups: (resource: TenantConfigLookupResource) =>
    api.get<Lookup[]>(`/${resource}`),
  createTenantConfigLookup: (resource: TenantConfigLookupResource, body: LookupWrite) =>
    api.post<Lookup>(`/${resource}`, body),
  updateTenantConfigLookup: (resource: TenantConfigLookupResource, id: string, body: LookupWrite) =>
    api.put<Lookup>(`/${resource}/${id}`, body),
};
