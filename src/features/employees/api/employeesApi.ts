import { api } from '@/lib/apiClient';
import type { Employee, EmployeeCreate, EmployeeList, EmployeePatch, EnableLoginRequest } from '@/types/api';
import type { ListParams } from '@/lib/queryKeys';

/** Employees API (company-scoped, D11). Sprint 2 Epic 2 adds onboarding + sectioned PATCH;
 * position fields, status and loginCode stay read-only here (owned by later epics). */
export const employeesApi = {
  list: (params: ListParams) =>
    api.get<EmployeeList>('/employees', {
      params: { page: params.page, pageSize: params.pageSize, search: params.search || undefined },
    }),

  get: (id: string) => api.get<Employee>(`/employees/${id}`),

  create: (body: EmployeeCreate) => api.post<Employee>('/employees', body),

  /** Merge-patch: ABSENT = unchanged, explicit null = clear. */
  patch: (id: string, body: EmployeePatch) => api.patch<Employee>(`/employees/${id}`, body),

  /** Assigns the global login CODE (Epic 3) — not a credential; `canLogin` stays false.
   * Empty body accepts the proposal; retry with `{ loginCode }` after 409 `LOGIN_CODE_TAKEN`. */
  enableLogin: (id: string, body?: EnableLoginRequest) =>
    api.post<Employee>(`/employees/${id}/enable-login`, body ?? {}),
};
