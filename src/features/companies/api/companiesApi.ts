import { api } from '@/lib/apiClient';
import type { Company, CompanyList, CompanyWrite } from '@/types/api';
import type { ListParams } from '@/lib/queryKeys';

/** Raw API calls for the companies resource. React Query hooks wrap these. */
export const companiesApi = {
  list: (params: ListParams) =>
    api.get<CompanyList>('/companies', {
      params: { page: params.page, pageSize: params.pageSize, search: params.search || undefined },
    }),

  get: (id: string) => api.get<Company>(`/companies/${id}`),

  create: (body: CompanyWrite) => api.post<Company>('/companies', body),

  update: (id: string, body: CompanyWrite) => api.put<Company>(`/companies/${id}`, body),

  setPrimary: (id: string) => api.post<void>(`/companies/${id}/set-primary`),
};
