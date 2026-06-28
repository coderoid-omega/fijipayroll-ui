import { api } from '@/lib/apiClient';
import type { Department, DepartmentWrite, Lookup, Office } from '@/types/api';

/**
 * Org lookups API. Departments + offices are company-scoped (header); occupations are tenant-wide.
 * Departments support create/update; offices & occupations are read-only in the Sprint 1 contract.
 */
export const orgApi = {
  listDepartments: () => api.get<Department[]>('/departments'),
  createDepartment: (body: DepartmentWrite) => api.post<Department>('/departments', body),
  updateDepartment: (id: string, body: DepartmentWrite) =>
    api.put<Department>(`/departments/${id}`, body),

  listOffices: () => api.get<Office[]>('/offices'),
  listOccupations: () => api.get<Lookup[]>('/occupations'),
};
