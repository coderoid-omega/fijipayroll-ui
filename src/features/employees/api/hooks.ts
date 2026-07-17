import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { queryKeys, type ListParams } from '@/lib/queryKeys';
import type {
  ContractChangeRequest,
  ContractTermCreate,
  ContractType,
  Employee,
  EmployeeCreate,
  EmployeePatch,
  EmploymentStage,
  EnableLoginRequest,
  EngagementPatch,
  ExitReason,
  ExtendProbationRequest,
  LiftSuspensionRequest,
  PayFrequency,
  RehireRequest,
  StageChangeRequest,
  SuspendRequest,
  TerminateRequest,
} from '@/types/api';
import { employeesApi } from './employeesApi';

// Reference data the employee forms need (contract types / stages / pay frequencies). Local hooks
// rather than imports from org-lookups/pay-calendar internals (CLAUDE.md §3: features never
// import from each other's internals); the central queryKeys keep the caches shared regardless.

export function useContractTypeOptions() {
  return useQuery({
    queryKey: queryKeys.contractTypes(),
    queryFn: () => api.get<ContractType[]>('/contract-types'),
    staleTime: 60 * 60_000,
  });
}

export function useEmploymentStageOptions() {
  return useQuery({
    queryKey: queryKeys.employmentStages(),
    queryFn: () => api.get<EmploymentStage[]>('/employment-stages'),
    staleTime: 60 * 60_000,
  });
}

export function useExitReasonOptions() {
  return useQuery({
    queryKey: queryKeys.exitReasons(),
    queryFn: () => api.get<ExitReason[]>('/exit-reasons'),
    staleTime: 60 * 60_000,
  });
}

export function usePayFrequencyOptions(companyId: string) {
  return useQuery({
    queryKey: queryKeys.payFrequencies(companyId),
    queryFn: () => api.get<PayFrequency[]>('/pay-frequencies'),
    enabled: Boolean(companyId),
  });
}

export function useEmployees(companyId: string, params: ListParams) {
  return useQuery({
    queryKey: queryKeys.employees.list(companyId, params),
    queryFn: () => employeesApi.list(params),
    enabled: Boolean(companyId),
  });
}

export function useEmployee(companyId: string, id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employees.detail(companyId, id ?? ''),
    queryFn: () => employeesApi.get(id as string),
    enabled: Boolean(companyId && id),
  });
}

export function useCreateEmployee(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmployeeCreate) => employeesApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.employees.all(companyId) }),
  });
}

export function usePatchEmployee(companyId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmployeePatch) => employeesApi.patch(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.employees.detail(companyId, id), updated);
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all(companyId) });
    },
  });
}

export function useEnableLogin(companyId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: EnableLoginRequest) => employeesApi.enableLogin(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.employees.detail(companyId, id), updated);
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all(companyId) });
    },
  });
}

// ---- engagements & lifecycle (Epic 4) ----

export function useEngagements(companyId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.employees.engagements(companyId, id),
    queryFn: () => employeesApi.engagements(id),
    enabled: Boolean(companyId && id),
  });
}

export function useContractTerms(companyId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.employees.contractTerms(companyId, id),
    queryFn: () => employeesApi.contractTerms(id),
    enabled: Boolean(companyId && id),
  });
}

export function useStageHistory(companyId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.employees.stageHistory(companyId, id),
    queryFn: () => employeesApi.stageHistory(id),
    enabled: Boolean(companyId && id),
  });
}

export function useContractTypeHistory(companyId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.employees.contractTypeHistory(companyId, id),
    queryFn: () => employeesApi.contractTypeHistory(id),
    enabled: Boolean(companyId && id),
  });
}

/** Shared onSuccess for the lifecycle actions: they return the updated Employee (cache updated
 * server-side in the same transaction as the history row), and every history list under the
 * detail subtree gets refetched. */
function useLifecycleMutation<TBody>(
  companyId: string,
  id: string,
  mutationFn: (body: TBody) => Promise<Employee>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.employees.detail(companyId, id), updated);
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all(companyId) });
    },
  });
}

export function useChangeStage(companyId: string, id: string) {
  return useLifecycleMutation(companyId, id, (body: StageChangeRequest) =>
    employeesApi.changeStage(id, body));
}

export function useExtendProbation(companyId: string, id: string) {
  return useLifecycleMutation(companyId, id, (body: ExtendProbationRequest) =>
    employeesApi.extendProbation(id, body));
}

export function useChangeContractType(companyId: string, id: string) {
  return useLifecycleMutation(companyId, id, (body: ContractChangeRequest) =>
    employeesApi.changeContractType(id, body));
}

export function useCreateContractTerm(companyId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ContractTermCreate) => employeesApi.createContractTerm(id, body),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.employees.contractTerms(companyId, id) }),
  });
}

// ---- status machine, suspension & exit (Epic 5) ----

export function useSuspensionHistory(companyId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.employees.suspensionHistory(companyId, id),
    queryFn: () => employeesApi.suspensionHistory(id),
    enabled: Boolean(companyId && id),
  });
}

export function useSuspendEmployee(companyId: string, id: string) {
  return useLifecycleMutation(companyId, id, (body: SuspendRequest) => employeesApi.suspend(id, body));
}

export function useLiftSuspension(companyId: string, id: string) {
  return useLifecycleMutation(companyId, id, (body?: LiftSuspensionRequest) =>
    employeesApi.liftSuspension(id, body));
}

export function useTerminateEmployee(companyId: string, id: string) {
  return useLifecycleMutation(companyId, id, (body: TerminateRequest) => employeesApi.terminate(id, body));
}

export function useRehireEmployee(companyId: string, id: string) {
  return useLifecycleMutation(companyId, id, (body: RehireRequest) => employeesApi.rehire(id, body));
}

export function usePatchEngagement(companyId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ engagementId, body }: { engagementId: string; body: EngagementPatch }) =>
      employeesApi.patchEngagement(id, engagementId, body),
    // The engagement changed and (when current) the employee cache with it — refresh the subtree.
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.employees.detail(companyId, id) }),
  });
}
