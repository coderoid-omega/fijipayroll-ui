/**
 * Domain DTO types — hand-written to mirror the canonical Sprint 1 contract:
 *   ../fijipayroll-api/docs/api-contract/openapi.yaml  (OpenAPI 3.1)
 *
 * The contract is the integration boundary (CLAUDE.md §6). These types are the UI-side
 * mirror; when the backend ships, regenerate the raw shapes with `npm run gen:api`
 * (-> src/types/openapi.d.ts) and reconcile any drift here. Keep this file the single
 * source of truth that React Query hooks and Zod schemas build against.
 */

// ---- cross-cutting ----

/** FJD amount, 2dp. The server is authoritative for any computed amount. */
export type Money = number;

/** RFC 7807 problem document — the shape of every non-2xx response. */
export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  /** Stable machine-readable code, e.g. COMPANY_CODE_DUPLICATE. */
  errorCode: string;
  traceId?: string;
  /** Field-level validation errors: field name -> messages. */
  errors?: Record<string, string[]>;
}

export interface PagedMeta {
  total: number;
  page: number;
  pageSize: number;
}

export type Paged<T> = PagedMeta & { items: T[] };

export interface Audit {
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface Lookup {
  id: string;
  code: string;
  name: string;
}

// ---- enums ----

export const PAY_GROUP_CODES = [
  'PY',
  'HP',
  'FP',
  'BK',
  'DD',
  'PD',
  'MP',
  'NT',
  'TA',
  'FB',
  'LP',
  'RP',
  'BN',
  'OO',
] as const;
export type PayGroupCode = (typeof PAY_GROUP_CODES)[number];

export type CalcType = 'Hour' | 'Dollar' | 'Percent' | 'Multiplier';
export type TaxType = 'Resident' | 'NonResident';
export type Levy = 'PAYE' | 'SRT' | 'ECAL';
export type PayFrequencyCode =
  | 'Weekly'
  | 'Fortnightly'
  | 'BiMonthly'
  | 'Monthly'
  | 'Wages'
  | 'FortnightlyWages';
export type PayPeriodStatus = 'Open' | 'Locked' | 'Completed';
export type RoundTo5cMode = 'None' | 'CashOnly' | 'All';
export type TaxCode = 'P' | 'S' | 'None';
export type PayType = 'Salary' | 'Hourly';
export type PaymentMethod = 'Cash' | 'Cheque' | 'DirectDeposit';
export type ActiveStatus = 'Active' | 'Inactive';

// ---- auth ----

export interface LoginRequest {
  /** Globally-unique employee/login code (NOT email). */
  loginCode: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface MeCompany {
  id: string;
  code: string;
  name: string;
  isPrimary: boolean;
}

export interface Me {
  userId: string;
  loginCode: string;
  displayName: string;
  userType?: 'Employee' | 'Admin' | 'System';
  tenant: { id: string; name: string };
  companies: MeCompany[];
  roles?: string[];
  permissions?: string[];
}

// ---- company (D11) ----

export interface Address {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  legalName?: string | null;
  isPrimary: boolean;
  fnpfEmployerNo?: string | null;
  fnpfCsCode?: string | null;
  fnpfCheckDigit?: string | null;
  tin?: string | null;
  address?: Address;
  defaultNormalPayCode?: string | null;
  defaultDirectorFeeCode?: string | null;
  defaultFnpfPayCode?: string | null;
  roundTo5cMode?: RoundTo5cMode;
  employerFnpfPct?: number | null;
  employeeFnpfPct?: number | null;
  employerFnpfExcessExemptPct?: number | null;
  autoAddFnpfPayCode?: boolean;
  enablePaydayReporting?: boolean;
  status: ActiveStatus;
  audit?: Audit;
}

/** Create/update payload. isPrimary is NOT set here — use POST /companies/{id}/set-primary. */
export interface CompanyWrite {
  code: string;
  name: string;
  legalName?: string | null;
  fnpfEmployerNo?: string | null;
  fnpfCsCode?: string | null;
  fnpfCheckDigit?: string | null;
  tin?: string | null;
  address?: Address;
  defaultNormalPayCode?: string | null;
  defaultDirectorFeeCode?: string | null;
  defaultFnpfPayCode?: string | null;
  roundTo5cMode?: RoundTo5cMode;
  employerFnpfPct?: number | null;
  employeeFnpfPct?: number | null;
  employerFnpfExcessExemptPct?: number | null;
  autoAddFnpfPayCode?: boolean;
  enablePaydayReporting?: boolean;
}

export type CompanyList = Paged<Company>;

// ---- pay groups / elements ----

export interface PayGroup {
  code: PayGroupCode;
  name: string;
  sortOrder?: number;
}

export interface PayElement {
  id: string;
  companyId: string;
  code: string;
  description: string;
  payGroupCode: PayGroupCode;
  calcType: CalcType;
  eRate: number;
  isPayeAble?: boolean;
  isFnpfAble?: boolean;
  isOneTimeForTax?: boolean;
  isPreTax?: boolean;
  isPostTax?: boolean;
  showOnPayslip?: boolean;
  hasGoalAmount?: boolean;
  quickEntryColumnNo?: number | null;
  validFrom: string;
  validTo?: string | null;
  status: ActiveStatus;
  audit?: Audit;
}

export interface PayElementWrite {
  code: string;
  description: string;
  payGroupCode: PayGroupCode;
  calcType: CalcType;
  eRate?: number;
  isPayeAble?: boolean;
  isFnpfAble?: boolean;
  isOneTimeForTax?: boolean;
  isPreTax?: boolean;
  isPostTax?: boolean;
  showOnPayslip?: boolean;
  hasGoalAmount?: boolean;
  quickEntryColumnNo?: number | null;
  validFrom: string;
}

export type PayElementList = Paged<PayElement>;

// ---- statutory (tenant-wide, effective-dated) ----

export interface TaxBracket {
  id?: string;
  taxType: TaxType;
  levy: Levy;
  lowerBound: number;
  upperBound?: number | null;
  baseAmount: number;
  /** e.g. 0.18 */
  marginalRate: number;
  ordinal: number;
}

export interface TaxRuleSet {
  id: string;
  code: string;
  description?: string | null;
  validFrom: string;
  validTo?: string | null;
  status: 'Active' | 'Superseded' | 'Draft';
  brackets: TaxBracket[];
}

export interface FnpfScheme {
  id: string;
  validFrom: string;
  validTo?: string | null;
  employeePct: number;
  employerPct: number;
  voluntaryPct?: number;
  employerExcessExemptPct: number;
  wageCeiling?: number | null;
  status: 'Active' | 'Superseded' | 'Draft';
}

// ---- statutory (write) ----

export type TaxBracketWrite = Omit<TaxBracket, 'id'>;

export interface TaxRuleSetWrite {
  code: string;
  description?: string | null;
  validFrom: string;
  /** Active supersedes the current active set; Draft is editable and not yet applied. */
  status?: 'Draft' | 'Active';
  brackets: TaxBracketWrite[];
}

export interface FnpfSchemeWrite {
  validFrom: string;
  employeePct: number;
  employerPct: number;
  voluntaryPct?: number;
  employerExcessExemptPct: number;
  wageCeiling?: number | null;
  status?: 'Draft' | 'Active';
}

// ---- calendar ----

export interface PayFrequency {
  id: string;
  companyId: string;
  code: PayFrequencyCode;
  periodsPerYear: number;
  isActive: boolean;
}

export interface PayPeriod {
  id: string;
  companyId: string;
  payFrequencyId: string;
  payYear: number;
  payNumber: number;
  beginDate: string;
  endDate: string;
  status: PayPeriodStatus;
}

// ---- org lookups ----

export interface Department {
  id: string;
  companyId: string;
  code: string;
  name: string;
  parentDepartmentId?: string | null;
  headEmployeeId?: string | null;
  status: ActiveStatus;
}

export interface DepartmentWrite {
  code: string;
  name: string;
  parentDepartmentId?: string | null;
  headEmployeeId?: string | null;
}

export interface Office {
  id: string;
  companyId: string;
  code: string;
  name: string;
  status: ActiveStatus;
}

export interface OfficeWrite {
  code: string;
  name: string;
}

/** Create/update payload for a tenant-wide reference lookup (e.g. occupation). */
export interface LookupWrite {
  code: string;
  name: string;
}

/** A company-scoped org-structure master (division / section / grade / level). Code is optional. */
export interface CompanyLookup {
  id: string;
  companyId: string;
  code?: string | null;
  name: string;
  status: ActiveStatus;
}

/** Create/update payload for a company-scoped org-structure master. Name required; code optional. */
export interface CompanyLookupWrite {
  code?: string | null;
  name: string;
}

// ---- employee-config lookups (Sprint 2 Epic 1 — ALL tenant-wide, OQ-24: no X-Company-Id) ----

/** Who ended the engagement. `Neither` covers fixed-term expiry, retirement, death. */
export type ExitInitiator = 'Employee' | 'Employer' | 'Neither';

/** The LEGAL BASIS of engagement — orthogonal to employment stage (spec §5). */
export interface ContractType extends Lookup {
  /** Requires contract terms with an end date (Epic 4). */
  isFixedTerm: boolean;
  status: ActiveStatus;
}

export interface ContractTypeWrite {
  code: string;
  name: string;
  isFixedTerm?: boolean;
  status?: ActiveStatus;
}

/** PROGRESSION within an engagement — Trainee / Probation / Confirmed (never "Permanent"). */
export interface EmploymentStage extends Lookup {
  /** Progression order, e.g. Trainee 1, Probation 2, Confirmed 3. */
  ordinal: number;
  /** Stage expects probation start/end dates on the employee. */
  isProbationary: boolean;
  status: ActiveStatus;
}

export interface EmploymentStageWrite {
  code: string;
  name: string;
  ordinal?: number;
  isProbationary?: boolean;
  status?: ActiveStatus;
}

/** Rules are data (D10): these flags drive severance/notice behaviour, never a switch on the code. */
export interface ExitReason extends Lookup {
  initiator: ExitInitiator;
  /** Domain §2.3 — true for redundancy; false for misconduct/resignation/expiry/retirement. */
  severanceEligible: boolean;
  noticeRequired: boolean;
  rehireEligible: boolean;
  status: ActiveStatus;
}

export interface ExitReasonWrite {
  code: string;
  name: string;
  initiator: ExitInitiator;
  severanceEligible?: boolean;
  noticeRequired?: boolean;
  rehireEligible?: boolean;
  status?: ActiveStatus;
}

// ---- employee (read; Sprint 2 Epic 0 identity split — two codes, not one) ----

/** Epic 5 DROPPED `Inactive` ([S06]) — never defined, never written, strictly dominated by
 * `Suspended`. (The config lookups' unrelated Active/Inactive enable-flag stays.) */
export type EmployeeStatus = 'Active' | 'Suspended' | 'Terminated';

/** Present only while status is `Suspended`. */
export interface Suspension {
  isPaid: boolean;
  startDate: string;
  endDate?: string | null;
  reason?: string | null;
}

export interface EmployeeSummary {
  id: string;
  companyId: string;
  /** Unique PER COMPANY (the same value may exist in another company). Replaces the Sprint-1 `code`. */
  employeeCode: string;
  /** Globally unique, NULLABLE — assigned only by enable-login (Epic 3), immutable once set. */
  loginCode?: string | null;
  displayName: string;
  fnpfNo?: string | null;
  tin?: string | null;
  taxCode?: TaxCode;
  dateOfHire?: string | null;
  payType?: PayType;
  status: EmployeeStatus;
  contractTypeId?: string | null;
  stageId?: string | null;
}

export interface Employee extends EmployeeSummary {
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  canLogin?: boolean;
  useSpecialTaxRate?: boolean;
  specialTaxRate?: number | null;
  taxCodeDeclarationDate?: string | null;
  taxType?: TaxType;
  dateOfBirth?: string | null;
  sex?: string | null;
  maritalStatus?: string | null;
  dateOfTermination?: string | null;
  payFrequencyId?: string | null;
  hourlyRate?: number | null;
  salaryPerPeriod?: number | null;
  /** Nullable — not settable at create (progressive profile), so a fresh employee has none. */
  paymentMethod?: PaymentMethod | null;
  isGrossUp?: boolean;
  standardHours?: number | null;
  salaryOtRate?: number | null;
  // org placement (OQ-25a) — a denormalised cache; the position timeline (Epic 6) is authoritative
  divisionId?: string | null;
  departmentId?: string | null;
  sectionId?: string | null;
  officeId?: string | null;
  gradeId?: string | null;
  levelId?: string | null;
  occupationId?: string | null;
  reportsToEmployeeId?: string | null;
  // lifecycle
  currentEngagementId?: string | null;
  continuousServiceDate?: string | null;
  probationStartDate?: string | null;
  probationEndDate?: string | null;
  suspension?: Suspension | null;
  /** Percent of the 360 profile populated (progressive profile, OQ-04). */
  profileCompleteness?: number;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankBranch?: string | null;
  audit?: Audit;
}

export type EmployeeList = Paged<EmployeeSummary>;

/** Contract `EmployeeCreate` — the minimal required core (OQ-04); the rest is completed
 * progressively via PATCH. `loginCode` is absent by design (enable-login, Epic 3). */
export interface EmployeeCreate {
  /** Omit to allocate from the per-company sequence. */
  employeeCode?: string | null;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  displayName?: string | null;
  contractTypeId: string;
  stageId?: string | null;
  dateOfHire: string;
  /** Carried-in service (may PREDATE hire — acquisitions, conversions). Defaults to dateOfHire.
   * Added Epic 5 ([S06] — the write path the EmployeePatch prune removed). */
  continuousServiceDate?: string | null;
  payType: PayType;
  hourlyRate?: number | null;
  salaryPerPeriod?: number | null;
  payFrequencyId?: string | null;
  taxCode: TaxCode;
  tin?: string | null;
  fnpfNo?: string | null;
  dateOfBirth?: string | null;
}

/** Contract `EnableLoginRequest` — omit `loginCode` to accept the server's
 * `{companyCode}-{employeeCode}` proposal; supply it after a 409 `LOGIN_CODE_TAKEN` collision.
 * NOTE: this assigns the login CODE only — no credential exists yet, so `canLogin` stays false
 * ("credentials pending"); the set-password flow is a later epic. */
export interface EnableLoginRequest {
  loginCode?: string;
}

/** Contract `EmployeePatch` — sectioned partial update (merge-patch: ABSENT = unchanged, explicit
 * null = clear). Position fields, `status` and `loginCode` are deliberately absent — they are
 * owned by transfer/regrade/rate-change (Epic 6), the status action (Epic 5) and enable-login.
 * Epic 4 BREAK: `contractTypeId` / `continuousServiceDate` / `probationStartDate` /
 * `probationEndDate` are REMOVED — engagement-cache fields, owned by the engagement actions
 * (contract-change, stage-change, extend-probation). */
export interface EmployeePatch {
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  displayName?: string | null;
  dateOfBirth?: string | null;
  sex?: string | null;
  maritalStatus?: string | null;
  tin?: string | null;
  fnpfNo?: string | null;
  taxCode?: TaxCode;
  taxType?: TaxType;
  useSpecialTaxRate?: boolean;
  specialTaxRate?: number | null;
  taxCodeDeclarationDate?: string | null;
  payFrequencyId?: string | null;
  /** Send null to CLEAR the payment method; omit to leave it unchanged. */
  paymentMethod?: PaymentMethod | null;
  isGrossUp?: boolean;
  standardHours?: number | null;
  salaryOtRate?: number | null;
  reportsToEmployeeId?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankBranch?: string | null;
}

// ---- engagements & lifecycle history (Sprint 2 Epic 4) ----

export type NoticeHandling = 'Served' | 'PaidInLieu' | 'Waived' | 'NotRequired';

/** One hire→terminate cycle (spec §4). AUTHORITATIVE for contract type / continuous service /
 * hire date; the same-named `Employee` fields are a cache of the CURRENT engagement, written only
 * by the engagement actions — never by PATCH. Exit fields are written by Epic 5's terminate. */
export interface Engagement {
  id: string;
  employeeId: string;
  companyId: string;
  /** The code held during THIS engagement (per-cycle fact, not a cache). */
  employeeCode: string;
  isCurrent: boolean;
  dateOfHire: string;
  continuousServiceDate?: string | null;
  contractTypeId: string;
  noticeDate?: string | null;
  noticePeriodDays?: number | null;
  lastWorkingDay?: string | null;
  terminationEffectiveDate?: string | null;
  exitReasonId?: string | null;
  noticeHandling?: NoticeHandling | null;
  audit: Audit;
}

/** A contract term on an engagement — a renewal is a NEW row linked via `renewalOf`. */
export interface ContractTerm {
  id: string;
  employeeId: string;
  engagementId: string;
  termStart: string;
  termEnd?: string | null;
  renewalOf?: string | null;
  signedDate?: string | null;
  audit: Audit;
}

export interface ContractTermCreate {
  termStart: string;
  termEnd?: string | null;
  renewalOf?: string | null;
  signedDate?: string | null;
}

/** A stage transition. A probation EXTENSION appears with `fromStageId` === `toStageId`. */
export interface StageHistoryEntry {
  id: string;
  employeeId: string;
  engagementId: string;
  fromStageId?: string | null;
  toStageId: string;
  effectiveDate: string;
  reason?: string | null;
  reviewRef?: string | null;
  audit: Audit;
}

export interface StageChangeRequest {
  toStageId: string;
  effectiveDate: string;
  reason?: string | null;
  reviewRef?: string | null;
}

export interface ExtendProbationRequest {
  newEndDate: string;
  reason: string;
}

/** A contract-type change — business history the engine reads; first row of each engagement is
 * the hire (`fromContractTypeId` null). */
export interface ContractTypeHistoryEntry {
  id: string;
  employeeId: string;
  engagementId: string;
  fromContractTypeId?: string | null;
  toContractTypeId: string;
  validFrom: string;
  reason?: string | null;
  audit: Audit;
}

/** Deliberately does NOT touch `continuousServiceDate` — carry-vs-reset is parked (OQ-15). */
export interface ContractChangeRequest {
  toContractTypeId: string;
  validFrom: string;
  reason?: string | null;
}

// ---- status machine, suspension & exit (Sprint 2 Epic 5) ----
// Four single-purpose actions ([S06]). State machine: Active→Suspended · Suspended→Active ·
// Active|Suspended→Terminated · Terminated→Active; everything else 409 INVALID_STATUS_TRANSITION.

export interface SuspendRequest {
  isPaid: boolean;
  startDate: string;
  /** Omit for an open-ended window. */
  endDate?: string | null;
  reason: string;
}

export interface LiftSuspensionRequest {
  /** Defaults to today; must not precede the window start. */
  endDate?: string | null;
  reason?: string | null;
}

/** `lastWorkingDay` != `terminationEffectiveDate` when notice is paid in lieu — both recorded,
 * neither derived. The exit reason's FLAGS drive behaviour (D10). */
export interface TerminateRequest {
  exitReasonId: string;
  noticeDate?: string | null;
  noticePeriodDays?: number | null;
  lastWorkingDay: string;
  terminationEffectiveDate: string;
  noticeHandling: NoticeHandling;
}

export interface RehireRequest {
  dateOfHire: string;
  contractTypeId: string;
  stageId?: string | null;
  /** Defaults to dateOfHire; carry-over from the prior engagement is never inferred. */
  continuousServiceDate?: string | null;
  /** Proceed despite rehireEligible = false on the prior exit reason. Requires overrideReason. */
  overrideRehireBlock?: boolean;
  overrideReason?: string | null;
}

/** One suspension WINDOW (an interval — [S06-resolved OQ-33]); `endDate` null while open. */
export interface SuspensionHistoryEntry {
  id: string;
  employeeId: string;
  engagementId: string;
  isPaid: boolean;
  startDate: string;
  endDate?: string | null;
  reason: string;
  liftedReason?: string | null;
  audit: Audit;
}

/** The continuous-service correction path ([S06]) — deliberately minimal. */
export interface EngagementPatch {
  continuousServiceDate: string;
}
