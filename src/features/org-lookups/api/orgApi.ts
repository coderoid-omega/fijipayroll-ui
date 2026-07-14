import { api } from '@/lib/apiClient';
import type {
  CompanyLookup,
  CompanyLookupWrite,
  Department,
  DepartmentWrite,
  Lookup,
  LookupWrite,
  Office,
  OfficeWrite,
} from '@/types/api';

/** The four company-scoped org-structure masters, all sharing the CompanyLookup shape. */
export type CompanyLookupResource = 'divisions' | 'sections' | 'grades' | 'levels';

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
};
