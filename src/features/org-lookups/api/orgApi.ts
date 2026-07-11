import { api } from '@/lib/apiClient';
import type {
  Department,
  DepartmentWrite,
  Lookup,
  LookupWrite,
  Office,
  OfficeWrite,
} from '@/types/api';

/**
 * Org lookups API. Departments + offices are company-scoped (header); occupations are tenant-wide.
 * All three support create/update.
 */
export const orgApi = {
  listDepartments: () => api.get<Department[]>('/departments'),
  createDepartment: (body: DepartmentWrite) => api.post<Department>('/departments', body),
  updateDepartment: (id: string, body: DepartmentWrite) =>
    api.put<Department>(`/departments/${id}`, body),

  listOffices: () => api.get<Office[]>('/offices'),
  createOffice: (body: OfficeWrite) => api.post<Office>('/offices', body),
  updateOffice: (id: string, body: OfficeWrite) => api.put<Office>(`/offices/${id}`, body),

  listOccupations: () => api.get<Lookup[]>('/occupations'),
  createOccupation: (body: LookupWrite) => api.post<Lookup>('/occupations', body),
  updateOccupation: (id: string, body: LookupWrite) =>
    api.put<Lookup>(`/occupations/${id}`, body),
};
