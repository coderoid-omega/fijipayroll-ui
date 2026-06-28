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

// ---- employee (read; stretch) ----

export interface EmployeeSummary {
  id: string;
  companyId: string;
  /** globally-unique; also the login code */
  code: string;
  displayName: string;
  fnpfNo?: string | null;
  tin?: string | null;
  taxCode?: TaxCode;
  dateOfHire?: string | null;
  payType?: PayType;
  status: 'Active' | 'Terminated' | 'Inactive';
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
  dateOfTermination?: string | null;
  payFrequencyId?: string | null;
  hourlyRate?: number | null;
  salaryPerPeriod?: number | null;
  paymentMethod?: PaymentMethod;
  isGrossUp?: boolean;
  standardHours?: number | null;
  departmentId?: string | null;
  officeId?: string | null;
  occupationId?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankBranch?: string | null;
  audit?: Audit;
}

export type EmployeeList = Paged<EmployeeSummary>;
