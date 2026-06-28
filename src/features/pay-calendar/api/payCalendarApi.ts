import { api } from '@/lib/apiClient';
import type { PayFrequency, PayPeriod } from '@/types/api';

/** Pay calendar API (company-scoped, read-only in Sprint 1). Company rides on the header. */
export const payCalendarApi = {
  listFrequencies: () => api.get<PayFrequency[]>('/pay-frequencies'),

  listPeriods: (params: { payYear?: number; payFrequencyId?: string }) =>
    api.get<PayPeriod[]>('/pay-periods', {
      params: {
        payYear: params.payYear,
        payFrequencyId: params.payFrequencyId || undefined,
      },
    }),
};
