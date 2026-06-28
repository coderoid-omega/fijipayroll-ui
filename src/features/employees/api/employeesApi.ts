import { api } from '@/lib/apiClient';
import type { Employee, EmployeeList } from '@/types/api';
import type { ListParams } from '@/lib/queryKeys';

/** Employees API (company-scoped, read-only in Sprint 1 — full CRUD is Sprint 2). */
export const employeesApi = {
  list: (params: ListParams) =>
    api.get<EmployeeList>('/employees', {
      params: { page: params.page, pageSize: params.pageSize, search: params.search || undefined },
    }),

  get: (id: string) => api.get<Employee>(`/employees/${id}`),
};
