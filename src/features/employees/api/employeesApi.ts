import { api } from '@/lib/apiClient';
import type {
  ContractChangeRequest,
  ContractTerm,
  ContractTermCreate,
  ContractTypeHistoryEntry,
  Employee,
  EmployeeCreate,
  EmployeeList,
  EmployeePatch,
  EnableLoginRequest,
  Engagement,
  ExtendProbationRequest,
  StageChangeRequest,
  StageHistoryEntry,
} from '@/types/api';
import type { ListParams } from '@/lib/queryKeys';

/** Employees API (company-scoped, D11). Sprint 2 Epic 2 adds onboarding + sectioned PATCH;
 * Epic 4 adds the engagement sub-resources + lifecycle actions. Position fields, status and
 * loginCode stay read-only here (owned by later epics). */
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

  // ---- engagements & lifecycle (Epic 4). The engagement is authoritative; the employee's
  // contract-type/continuous-service/probation fields are a cache written only by these actions.

  engagements: (id: string) => api.get<Engagement[]>(`/employees/${id}/engagements`),

  contractTerms: (id: string) => api.get<ContractTerm[]>(`/employees/${id}/contract-terms`),

  /** A renewal is a NEW row with `renewalOf` — never an overwrite. */
  createContractTerm: (id: string, body: ContractTermCreate) =>
    api.post<ContractTerm>(`/employees/${id}/contract-terms`, body),

  stageHistory: (id: string) => api.get<StageHistoryEntry[]>(`/employees/${id}/stage-history`),

  /** Duplicate effective date on the engagement → 409 `STAGE_CHANGE_DATE_CONFLICT`. */
  changeStage: (id: string, body: StageChangeRequest) =>
    api.post<Employee>(`/employees/${id}/stage-change`, body),

  /** End-date change + history row; the stage does NOT change (spec §9.1). */
  extendProbation: (id: string, body: ExtendProbationRequest) =>
    api.post<Employee>(`/employees/${id}/extend-probation`, body),

  contractTypeHistory: (id: string) =>
    api.get<ContractTypeHistoryEntry[]>(`/employees/${id}/contract-type-history`),

  /** Never touches `continuousServiceDate` (OQ-15 parked). */
  changeContractType: (id: string, body: ContractChangeRequest) =>
    api.post<Employee>(`/employees/${id}/contract-change`, body),
};
