import { api } from '@/lib/apiClient';
import type { PayElement, PayElementList, PayElementWrite, PayGroup } from '@/types/api';
import type { ListParams } from '@/lib/queryKeys';

/**
 * Pay groups + pay elements API. Pay elements are company-scoped — the active company rides on the
 * X-Company-Id header added by the Axios interceptor, so callers don't pass it explicitly.
 */
export const payElementsApi = {
  groups: () => api.get<PayGroup[]>('/pay-groups'),

  list: (params: ListParams & { payGroupCode?: string }) =>
    api.get<PayElementList>('/pay-elements', {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search || undefined,
        payGroupCode: params.payGroupCode || undefined,
      },
    }),

  get: (id: string) => api.get<PayElement>(`/pay-elements/${id}`),

  create: (body: PayElementWrite) => api.post<PayElement>('/pay-elements', body),

  update: (id: string, body: PayElementWrite) => api.put<PayElement>(`/pay-elements/${id}`, body),
};
