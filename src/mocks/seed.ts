/**
 * MSW seed data — an in-memory database that mirrors the Sprint 1 contract with realistic Fiji
 * payroll data. Sources: ../Docs/FijiPayroll2025-Desktop-App-Dissection.md (14 pay groups,
 * default pay codes, company settings) and ../Docs/Fiji-Payroll-Domain-Reference.md (PAYE/SRT/
 * ECAL bands, FNPF rates). Handlers mutate these collections in place.
 */
import type {
  Company,
  CompanyLookup,
  ContractTerm,
  ContractType,
  ContractTypeHistoryEntry,
  Department,
  Employee,
  EmploymentStage,
  Engagement,
  ExitReason,
  FnpfScheme,
  Me,
  Office,
  PayElement,
  PayFrequency,
  PayGroup,
  PayPeriod,
  Lookup,
  StageHistoryEntry,
  SuspensionHistoryEntry,
  TaxBracket,
  TaxRuleSet,
} from '@/types/api';

// Stable IDs so relationships line up across collections.
export const IDS = {
  tenant: '11111111-1111-1111-1111-111111111111',
  user: '22222222-2222-2222-2222-222222222222',
  companyDemo: 'c0000000-0000-0000-0000-000000000001',
  companySample: 'c0000000-0000-0000-0000-000000000002',
  freqMonthly: 'f0000000-0000-0000-0000-000000000001',
  freqFortnightly: 'f0000000-0000-0000-0000-000000000002',
  taxRuleSet2026: 'a0000000-0000-0000-0000-000000000001',
  fnpf2026: 'b0000000-0000-0000-0000-000000000001',
} as const;

const now = '2026-01-15T08:00:00Z';
const audit = { createdAt: now, createdBy: 'system', updatedAt: null, updatedBy: null };

// ---- companies (D11): one primary brand + one non-primary brand ----
export const companies: Company[] = [
  {
    id: IDS.companyDemo,
    code: 'DEMO',
    name: 'Demo Company Ltd',
    legalName: 'Demo Company (Fiji) Limited',
    isPrimary: true,
    fnpfEmployerNo: 'FNPF-100245',
    fnpfCsCode: 'CS-01',
    fnpfCheckDigit: '7',
    tin: '12-34567-8-9',
    address: { line1: '21 Victoria Parade', line2: 'Level 3', city: 'Suva' },
    defaultNormalPayCode: '101',
    defaultDirectorFeeCode: '190',
    defaultFnpfPayCode: '301',
    roundTo5cMode: 'CashOnly',
    employerFnpfPct: 10,
    employeeFnpfPct: 8,
    employerFnpfExcessExemptPct: 0,
    autoAddFnpfPayCode: true,
    enablePaydayReporting: true,
    status: 'Active',
    audit,
  },
  {
    id: IDS.companySample,
    code: 'SAMPLE',
    name: 'Sample Trading Co',
    legalName: 'Sample Trading Company Pte Ltd',
    isPrimary: false,
    fnpfEmployerNo: 'FNPF-100888',
    fnpfCsCode: 'CS-01',
    fnpfCheckDigit: '3',
    tin: '98-76543-2-1',
    address: { line1: '5 Renwick Road', line2: null, city: 'Lautoka' },
    defaultNormalPayCode: '101',
    defaultDirectorFeeCode: '190',
    defaultFnpfPayCode: '301',
    roundTo5cMode: 'None',
    employerFnpfPct: 10,
    employeeFnpfPct: 8,
    employerFnpfExcessExemptPct: 0,
    autoAddFnpfPayCode: true,
    enablePaydayReporting: true,
    status: 'Active',
    audit,
  },
];

// ---- /me ----
export const me: Me = {
  userId: IDS.user,
  loginCode: 'ADMIN001',
  displayName: 'Sai Prasad',
  userType: 'Admin',
  tenant: { id: IDS.tenant, name: 'Pacific Holdings Group' },
  companies: companies.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    isPrimary: c.isPrimary,
  })),
  roles: ['IT/Admin', 'Payroll Officer'],
  permissions: [
    'companies:read',
    'companies:write',
    'pay-elements:read',
    'pay-elements:write',
    'tax-config:read',
    'statutory.write',
    'employees:read',
  ],
};

// ---- the 14 pay groups (desktop dissection §3) ----
export const payGroups: PayGroup[] = [
  { code: 'PY', name: 'Standard Pay', sortOrder: 1 },
  { code: 'HP', name: 'Holiday Pay', sortOrder: 2 },
  { code: 'FP', name: 'FNPF', sortOrder: 3 },
  { code: 'BK', name: 'Bank Deduction', sortOrder: 4 },
  { code: 'DD', name: 'Miscellaneous Deduction', sortOrder: 5 },
  { code: 'PD', name: 'Pre-Tax Deduction', sortOrder: 6 },
  { code: 'MP', name: 'Miscellaneous Payment', sortOrder: 7 },
  { code: 'NT', name: 'Non Taxable Allowance', sortOrder: 8 },
  { code: 'TA', name: 'Taxable Allowance', sortOrder: 9 },
  { code: 'FB', name: 'Fringe Benefit', sortOrder: 10 },
  { code: 'LP', name: 'Lump Sum Payment', sortOrder: 11 },
  { code: 'RP', name: 'Redundancy Payment', sortOrder: 12 },
  { code: 'BN', name: 'Bonus Pay', sortOrder: 13 },
  { code: 'OO', name: 'Other One-Off Payment', sortOrder: 14 },
];

// ---- default pay codes (dissection §4) for the primary company ----
type PayElementSeed = Omit<PayElement, 'id' | 'companyId' | 'audit' | 'validFrom' | 'status'> & {
  validFrom?: string;
};

function payEl(companyId: string, idx: number, seed: PayElementSeed): PayElement {
  return {
    id: `e0000000-0000-0000-0000-0000000${String(idx).padStart(5, '0')}`,
    companyId,
    validFrom: seed.validFrom ?? '2026-01-01',
    status: 'Active',
    audit,
    ...seed,
  };
}

const demoElementSeeds: PayElementSeed[] = [
  { code: '101', description: 'Regular', payGroupCode: 'PY', calcType: 'Hour', eRate: 1.0, isPayeAble: true, isFnpfAble: true, isOneTimeForTax: false, isPreTax: false, isPostTax: false, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: 1 },
  { code: '102', description: 'Time & Half', payGroupCode: 'PY', calcType: 'Multiplier', eRate: 1.5, isPayeAble: true, isFnpfAble: true, isOneTimeForTax: true, isPreTax: false, isPostTax: false, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: 2 },
  { code: '103', description: 'Double Time', payGroupCode: 'PY', calcType: 'Multiplier', eRate: 2.0, isPayeAble: true, isFnpfAble: true, isOneTimeForTax: true, isPreTax: false, isPostTax: false, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: 3 },
  { code: '110', description: 'Vacation Pay', payGroupCode: 'HP', calcType: 'Hour', eRate: 1.0, isPayeAble: true, isFnpfAble: true, isOneTimeForTax: false, isPreTax: false, isPostTax: false, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: 4 },
  { code: '111', description: 'Sick Pay', payGroupCode: 'HP', calcType: 'Hour', eRate: 1.0, isPayeAble: true, isFnpfAble: true, isOneTimeForTax: false, isPreTax: false, isPostTax: false, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: 5 },
  { code: '120', description: 'Bonus', payGroupCode: 'BN', calcType: 'Dollar', eRate: 1.0, isPayeAble: true, isFnpfAble: false, isOneTimeForTax: true, isPreTax: false, isPostTax: false, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: null },
  { code: '121', description: 'Misc. Income', payGroupCode: 'MP', calcType: 'Dollar', eRate: 1.0, isPayeAble: true, isFnpfAble: false, isOneTimeForTax: false, isPreTax: false, isPostTax: false, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: null },
  { code: '150', description: 'Loan Repayment', payGroupCode: 'DD', calcType: 'Dollar', eRate: 1.0, isPayeAble: false, isFnpfAble: false, isOneTimeForTax: false, isPreTax: false, isPostTax: true, showOnPayslip: true, hasGoalAmount: true, quickEntryColumnNo: null },
  { code: '190', description: 'Director Fee', payGroupCode: 'PY', calcType: 'Dollar', eRate: 1.0, isPayeAble: true, isFnpfAble: false, isOneTimeForTax: false, isPreTax: false, isPostTax: false, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: null },
  { code: '210', description: 'Housing Allowance', payGroupCode: 'TA', calcType: 'Dollar', eRate: 1.0, isPayeAble: true, isFnpfAble: false, isOneTimeForTax: false, isPreTax: false, isPostTax: false, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: null },
  { code: '220', description: 'Meal Allowance (Non-Taxable)', payGroupCode: 'NT', calcType: 'Dollar', eRate: 1.0, isPayeAble: false, isFnpfAble: false, isOneTimeForTax: false, isPreTax: false, isPostTax: false, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: null },
  { code: '301', description: 'FNPF Employee', payGroupCode: 'FP', calcType: 'Percent', eRate: 1.0, isPayeAble: false, isFnpfAble: false, isOneTimeForTax: false, isPreTax: false, isPostTax: true, showOnPayslip: true, hasGoalAmount: false, quickEntryColumnNo: null },
];

export const payElements: PayElement[] = demoElementSeeds.map((s, i) =>
  payEl(IDS.companyDemo, i + 1, s),
);

// ---- statutory: PAYE / SRT / ECAL bands (Domain Reference §2) — tenant-wide, 2026 ----
function bracket(b: TaxBracket): TaxBracket {
  return b;
}

const brackets2026: TaxBracket[] = [
  // PAYE — resident (tax-free threshold $30,000)
  bracket({ taxType: 'Resident', levy: 'PAYE', lowerBound: 0, upperBound: 30000, baseAmount: 0, marginalRate: 0, ordinal: 1 }),
  bracket({ taxType: 'Resident', levy: 'PAYE', lowerBound: 30000, upperBound: 50000, baseAmount: 0, marginalRate: 0.18, ordinal: 2 }),
  bracket({ taxType: 'Resident', levy: 'PAYE', lowerBound: 50000, upperBound: 270000, baseAmount: 3600, marginalRate: 0.2, ordinal: 3 }),
  bracket({ taxType: 'Resident', levy: 'PAYE', lowerBound: 270000, upperBound: null, baseAmount: 47600, marginalRate: 0.2, ordinal: 4 }),
  // PAYE — non-resident (20% from the first dollar)
  bracket({ taxType: 'NonResident', levy: 'PAYE', lowerBound: 0, upperBound: null, baseAmount: 0, marginalRate: 0.2, ordinal: 1 }),
  // SRT — chargeable income > $270,000
  bracket({ taxType: 'Resident', levy: 'SRT', lowerBound: 270000, upperBound: 300000, baseAmount: 0, marginalRate: 0.13, ordinal: 1 }),
  bracket({ taxType: 'Resident', levy: 'SRT', lowerBound: 300000, upperBound: 350000, baseAmount: 5400, marginalRate: 0.14, ordinal: 2 }),
  bracket({ taxType: 'Resident', levy: 'SRT', lowerBound: 350000, upperBound: 400000, baseAmount: 14900, marginalRate: 0.15, ordinal: 3 }),
  bracket({ taxType: 'Resident', levy: 'SRT', lowerBound: 400000, upperBound: 450000, baseAmount: 24900, marginalRate: 0.16, ordinal: 4 }),
  bracket({ taxType: 'Resident', levy: 'SRT', lowerBound: 450000, upperBound: 500000, baseAmount: 35400, marginalRate: 0.17, ordinal: 5 }),
  bracket({ taxType: 'Resident', levy: 'SRT', lowerBound: 500000, upperBound: 1000000, baseAmount: 46400, marginalRate: 0.18, ordinal: 6 }),
  bracket({ taxType: 'Resident', levy: 'SRT', lowerBound: 1000000, upperBound: null, baseAmount: 161400, marginalRate: 0.19, ordinal: 7 }),
  // ECAL — 5% on chargeable income over $270,000
  bracket({ taxType: 'Resident', levy: 'ECAL', lowerBound: 270000, upperBound: null, baseAmount: 0, marginalRate: 0.05, ordinal: 1 }),
];

export const taxRuleSets: TaxRuleSet[] = [
  {
    id: IDS.taxRuleSet2026,
    code: 'FJ-STAT-2026.1',
    description: 'Fiji statutory PAYE/SRT/ECAL — 2026 tax year',
    validFrom: '2026-01-01',
    validTo: null,
    status: 'Active',
    brackets: brackets2026.map((b, i) => ({ ...b, id: `d0000000-0000-0000-0000-0000000${String(i).padStart(5, '0')}` })),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    code: 'FJ-STAT-2025.1',
    description: 'Fiji statutory PAYE/SRT/ECAL — 2025 tax year (superseded)',
    validFrom: '2025-01-01',
    validTo: '2025-12-31',
    status: 'Superseded',
    brackets: brackets2026.map((b, i) => ({ ...b, id: `d0000000-0000-0000-0000-0000001${String(i).padStart(5, '0')}` })),
  },
];

export const fnpfSchemes: FnpfScheme[] = [
  {
    id: IDS.fnpf2026,
    validFrom: '2026-01-01',
    validTo: null,
    employeePct: 8,
    employerPct: 10,
    voluntaryPct: 0,
    employerExcessExemptPct: 10,
    wageCeiling: null,
    status: 'Active',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    validFrom: '2020-04-01',
    validTo: '2021-12-31',
    employeePct: 5,
    employerPct: 5,
    voluntaryPct: 0,
    employerExcessExemptPct: 10,
    wageCeiling: null,
    status: 'Superseded',
  },
];

// ---- calendar (per company) ----
export const payFrequencies: PayFrequency[] = [
  { id: IDS.freqMonthly, companyId: IDS.companyDemo, code: 'Monthly', periodsPerYear: 12, isActive: true },
  { id: IDS.freqFortnightly, companyId: IDS.companyDemo, code: 'Fortnightly', periodsPerYear: 26, isActive: true },
  { id: 'f0000000-0000-0000-0000-000000000003', companyId: IDS.companySample, code: 'Monthly', periodsPerYear: 12, isActive: true },
];

function monthlyPeriods(companyId: string, freqId: string): PayPeriod[] {
  const months = [
    ['01-01', '01-31'],
    ['02-01', '02-28'],
    ['03-01', '03-31'],
    ['04-01', '04-30'],
    ['05-01', '05-31'],
    ['06-01', '06-30'],
    ['07-01', '07-31'],
    ['08-01', '08-31'],
    ['09-01', '09-30'],
    ['10-01', '10-31'],
    ['11-01', '11-30'],
    ['12-01', '12-31'],
  ];
  return months.map(([begin, end], i) => ({
    id: `p${companyId.slice(1)}-${String(i + 1).padStart(2, '0')}`,
    companyId,
    payFrequencyId: freqId,
    payYear: 2026,
    payNumber: i + 1,
    beginDate: `2026-${begin}`,
    endDate: `2026-${end}`,
    // First five months completed, June open, rest future-open.
    status: i < 5 ? 'Completed' : 'Open',
  }));
}

export const payPeriods: PayPeriod[] = monthlyPeriods(IDS.companyDemo, IDS.freqMonthly);

// ---- org lookups ----
export const departments: Department[] = [
  { id: 'de000000-0000-0000-0000-000000000001', companyId: IDS.companyDemo, code: 'ADM', name: 'Administration', parentDepartmentId: null, headEmployeeId: null, status: 'Active' },
  { id: 'de000000-0000-0000-0000-000000000002', companyId: IDS.companyDemo, code: 'FIN', name: 'Finance', parentDepartmentId: null, headEmployeeId: null, status: 'Active' },
  { id: 'de000000-0000-0000-0000-000000000003', companyId: IDS.companyDemo, code: 'OPS', name: 'Operations', parentDepartmentId: null, headEmployeeId: null, status: 'Active' },
];

export const offices: Office[] = [
  { id: 'of000000-0000-0000-0000-000000000001', companyId: IDS.companyDemo, code: 'SUV', name: 'Suva Head Office', status: 'Active' },
  { id: 'of000000-0000-0000-0000-000000000002', companyId: IDS.companyDemo, code: 'NAD', name: 'Nadi Branch', status: 'Active' },
];

export const divisions: CompanyLookup[] = [
  { id: 'dv000000-0000-0000-0000-000000000001', companyId: IDS.companyDemo, code: 'WD', name: 'Western Division', status: 'Active' },
  { id: 'dv000000-0000-0000-0000-000000000002', companyId: IDS.companyDemo, code: null, name: 'Central Division', status: 'Active' },
];

export const sections: CompanyLookup[] = [
  { id: 'se000000-0000-0000-0000-000000000001', companyId: IDS.companyDemo, code: 'PCK', name: 'Packing', status: 'Active' },
];

export const grades: CompanyLookup[] = [
  { id: 'gr000000-0000-0000-0000-000000000001', companyId: IDS.companyDemo, code: 'G5', name: 'Grade 5', status: 'Active' },
];

export const levels: CompanyLookup[] = [
  { id: 'lv000000-0000-0000-0000-000000000001', companyId: IDS.companyDemo, code: null, name: 'Senior', status: 'Active' },
];

export const occupations: Lookup[] = [
  { id: 'oc000000-0000-0000-0000-000000000001', code: 'ACC', name: 'Accountant' },
  { id: 'oc000000-0000-0000-0000-000000000002', code: 'CLK', name: 'Clerk' },
  { id: 'oc000000-0000-0000-0000-000000000003', code: 'MGR', name: 'Manager' },
  { id: 'oc000000-0000-0000-0000-000000000004', code: 'LAB', name: 'Labourer' },
];

export const provinces: Lookup[] = [
  { id: 'pr000000-0000-0000-0000-000000000001', code: 'REW', name: 'Rewa' },
  { id: 'pr000000-0000-0000-0000-000000000002', code: 'BA', name: 'Ba' },
  { id: 'pr000000-0000-0000-0000-000000000003', code: 'NAI', name: 'Naitasiri' },
  { id: 'pr000000-0000-0000-0000-000000000004', code: 'MAC', name: 'Macuata' },
];

export const ethnicOrigins: Lookup[] = [
  { id: 'et000000-0000-0000-0000-000000000001', code: 'ITA', name: 'iTaukei' },
  { id: 'et000000-0000-0000-0000-000000000002', code: 'IND', name: 'Fijian of Indian descent' },
  { id: 'et000000-0000-0000-0000-000000000003', code: 'OTH', name: 'Other' },
];

// ---- employee-config lookups (Sprint 2 Epic 1 — tenant-wide, OQ-24) ----
// Mirrors the API seed (fijipayroll-api schema-sprint-2 §16) so mocked/real worlds line up.

export const contractTypes: ContractType[] = [
  { id: 'ct000000-0000-0000-0000-000000000001', code: 'PERM', name: 'Permanent', isFixedTerm: false, status: 'Active' },
  { id: 'ct000000-0000-0000-0000-000000000002', code: 'FIXED', name: 'Fixed-term', isFixedTerm: true, status: 'Active' },
  { id: 'ct000000-0000-0000-0000-000000000003', code: 'CASUAL', name: 'Casual', isFixedTerm: false, status: 'Active' },
  { id: 'ct000000-0000-0000-0000-000000000004', code: 'TEMP', name: 'Temporary', isFixedTerm: false, status: 'Active' },
  { id: 'ct000000-0000-0000-0000-000000000005', code: 'INTERN', name: 'Intern', isFixedTerm: true, status: 'Active' },
  { id: 'ct000000-0000-0000-0000-000000000006', code: 'APPR', name: 'Apprentice', isFixedTerm: true, status: 'Active' },
];

export const employmentStages: EmploymentStage[] = [
  { id: 'es000000-0000-0000-0000-000000000001', code: 'TRAINEE', name: 'Trainee', ordinal: 1, isProbationary: false, status: 'Active' },
  { id: 'es000000-0000-0000-0000-000000000002', code: 'PROB', name: 'Probation', ordinal: 2, isProbationary: true, status: 'Active' },
  { id: 'es000000-0000-0000-0000-000000000003', code: 'CONF', name: 'Confirmed', ordinal: 3, isProbationary: false, status: 'Active' },
];

// The flags ARE the behaviour (D10): severance only on redundancy (Domain §2.3).
export const exitReasons: ExitReason[] = [
  { id: 'xr000000-0000-0000-0000-000000000001', code: 'RESIGN', name: 'Resignation', initiator: 'Employee', severanceEligible: false, noticeRequired: true, rehireEligible: true, status: 'Active' },
  { id: 'xr000000-0000-0000-0000-000000000002', code: 'REDUND', name: 'Redundancy', initiator: 'Employer', severanceEligible: true, noticeRequired: true, rehireEligible: true, status: 'Active' },
  { id: 'xr000000-0000-0000-0000-000000000003', code: 'MISCON', name: 'Misconduct', initiator: 'Employer', severanceEligible: false, noticeRequired: true, rehireEligible: false, status: 'Active' },
  { id: 'xr000000-0000-0000-0000-000000000004', code: 'SUMDIS', name: 'Summary dismissal (serious misconduct)', initiator: 'Employer', severanceEligible: false, noticeRequired: false, rehireEligible: false, status: 'Active' },
  { id: 'xr000000-0000-0000-0000-000000000005', code: 'INCAP', name: 'Incapacity', initiator: 'Employer', severanceEligible: false, noticeRequired: true, rehireEligible: true, status: 'Active' },
  { id: 'xr000000-0000-0000-0000-000000000006', code: 'PROBFAIL', name: 'Failed probation', initiator: 'Employer', severanceEligible: false, noticeRequired: true, rehireEligible: true, status: 'Active' },
  { id: 'xr000000-0000-0000-0000-000000000007', code: 'EXPIRY', name: 'Fixed-term expiry', initiator: 'Neither', severanceEligible: false, noticeRequired: false, rehireEligible: true, status: 'Active' },
  { id: 'xr000000-0000-0000-0000-000000000008', code: 'RETIRE', name: 'Retirement', initiator: 'Neither', severanceEligible: false, noticeRequired: false, rehireEligible: false, status: 'Active' },
  { id: 'xr000000-0000-0000-0000-000000000009', code: 'DEATH', name: 'Death in service', initiator: 'Neither', severanceEligible: false, noticeRequired: false, rehireEligible: false, status: 'Active' },
  { id: 'xr000000-0000-0000-0000-000000000010', code: 'ABANDON', name: 'Abandonment of employment', initiator: 'Employee', severanceEligible: false, noticeRequired: false, rehireEligible: false, status: 'Active' },
  { id: 'xr000000-0000-0000-0000-000000000011', code: 'MUTUAL', name: 'Mutual separation', initiator: 'Employer', severanceEligible: false, noticeRequired: true, rehireEligible: true, status: 'Active' },
];

export const workPermitTypes: Lookup[] = [
  { id: 'wp000000-0000-0000-0000-000000000001', code: 'LT', name: 'Long-term (3yr)' },
  { id: 'wp000000-0000-0000-0000-000000000002', code: 'ST', name: 'Short-term (up to 1yr)' },
  { id: 'wp000000-0000-0000-0000-000000000003', code: 'SEC', name: 'Secondment' },
];

export const relationshipTypes: Lookup[] = [
  { id: 'rt000000-0000-0000-0000-000000000001', code: 'SPOUSE', name: 'Spouse' },
  { id: 'rt000000-0000-0000-0000-000000000002', code: 'CHILD', name: 'Child' },
  { id: 'rt000000-0000-0000-0000-000000000003', code: 'PARENT', name: 'Parent' },
  { id: 'rt000000-0000-0000-0000-000000000004', code: 'SIBLING', name: 'Sibling' },
  { id: 'rt000000-0000-0000-0000-000000000005', code: 'OTHER', name: 'Other' },
];

export const documentTypes: Lookup[] = [
  { id: 'dt000000-0000-0000-0000-000000000001', code: 'CONTRACT', name: 'Contract' },
  { id: 'dt000000-0000-0000-0000-000000000002', code: 'TCD', name: 'TCD Form' },
  { id: 'dt000000-0000-0000-0000-000000000003', code: 'ID', name: 'ID/Passport' },
  { id: 'dt000000-0000-0000-0000-000000000004', code: 'CERT', name: 'Certificate' },
  { id: 'dt000000-0000-0000-0000-000000000005', code: 'PERMIT', name: 'Work Permit' },
  { id: 'dt000000-0000-0000-0000-000000000006', code: 'PHOTO', name: 'Photo' },
  { id: 'dt000000-0000-0000-0000-000000000007', code: 'OTHER', name: 'Other' },
];

// ---- employees (read; stretch) ----
export const employees: Employee[] = [
  {
    id: 'em000000-0000-0000-0000-000000000001',
    companyId: IDS.companyDemo,
    employeeCode: 'EMP001',
    displayName: 'Sefanaia Naivalu',
    firstName: 'Sefanaia',
    lastName: 'Naivalu',
    fnpfNo: 'FNPF-552031',
    tin: '50-11122-3-4',
    taxCode: 'P',
    taxType: 'Resident',
    dateOfHire: '2021-03-01',
    dateOfBirth: '1990-07-12',
    payType: 'Salary',
    salaryPerPeriod: 3500,
    paymentMethod: 'DirectDeposit',
    payFrequencyId: IDS.freqMonthly,
    departmentId: 'de000000-0000-0000-0000-000000000002',
    officeId: 'of000000-0000-0000-0000-000000000001',
    occupationId: 'oc000000-0000-0000-0000-000000000001',
    standardHours: 160,
    status: 'Active',
    // Epic 4: engagement cache — mirrors the current engagement (the backfill shape).
    contractTypeId: 'ct000000-0000-0000-0000-000000000001',
    stageId: 'es000000-0000-0000-0000-000000000003',
    currentEngagementId: 'en000000-0000-0000-0000-000000000001',
    continuousServiceDate: '2021-03-01',
    audit,
  },
  {
    id: 'em000000-0000-0000-0000-000000000002',
    companyId: IDS.companyDemo,
    employeeCode: 'EMP002',
    displayName: 'Priya Sharma',
    firstName: 'Priya',
    lastName: 'Sharma',
    fnpfNo: 'FNPF-552099',
    tin: '50-99988-7-6',
    taxCode: 'P',
    taxType: 'Resident',
    dateOfHire: '2022-09-15',
    dateOfBirth: '1995-02-28',
    payType: 'Hourly',
    hourlyRate: 14.5,
    paymentMethod: 'DirectDeposit',
    payFrequencyId: IDS.freqMonthly,
    departmentId: 'de000000-0000-0000-0000-000000000003',
    officeId: 'of000000-0000-0000-0000-000000000002',
    occupationId: 'oc000000-0000-0000-0000-000000000002',
    standardHours: 160,
    status: 'Active',
    contractTypeId: 'ct000000-0000-0000-0000-000000000003',
    stageId: 'es000000-0000-0000-0000-000000000002',
    currentEngagementId: 'en000000-0000-0000-0000-000000000002',
    continuousServiceDate: '2022-09-15',
    probationStartDate: '2026-06-01',
    probationEndDate: '2026-09-01',
    audit,
  },
  {
    id: 'em000000-0000-0000-0000-000000000003',
    companyId: IDS.companySample,
    employeeCode: 'EMP100',
    displayName: 'John Whippy',
    firstName: 'John',
    lastName: 'Whippy',
    fnpfNo: 'FNPF-771000',
    tin: '60-12345-6-7',
    taxCode: 'P',
    taxType: 'Resident',
    dateOfHire: '2023-01-10',
    dateOfBirth: '1988-11-05',
    payType: 'Salary',
    salaryPerPeriod: 4200,
    paymentMethod: 'DirectDeposit',
    standardHours: 160,
    status: 'Active',
    contractTypeId: 'ct000000-0000-0000-0000-000000000002',
    stageId: 'es000000-0000-0000-0000-000000000003',
    currentEngagementId: 'en000000-0000-0000-0000-000000000003',
    continuousServiceDate: '2023-01-10',
    audit,
  },
];

// ---- engagements & lifecycle history (Sprint 2 Epic 4) ----
// Mirrors the API's backfill: every employee has exactly one CURRENT engagement whose
// contract-type / continuous-service values agree with the employee cache, and the timelines
// start at hire (first contract-type row from null; first stage row where a stage is set).

export const engagements: Engagement[] = [
  {
    id: 'en000000-0000-0000-0000-000000000001',
    employeeId: 'em000000-0000-0000-0000-000000000001',
    companyId: IDS.companyDemo,
    employeeCode: 'EMP001',
    isCurrent: true,
    dateOfHire: '2021-03-01',
    continuousServiceDate: '2021-03-01',
    contractTypeId: 'ct000000-0000-0000-0000-000000000001',
    audit,
  },
  {
    id: 'en000000-0000-0000-0000-000000000002',
    employeeId: 'em000000-0000-0000-0000-000000000002',
    companyId: IDS.companyDemo,
    employeeCode: 'EMP002',
    isCurrent: true,
    dateOfHire: '2022-09-15',
    continuousServiceDate: '2022-09-15',
    contractTypeId: 'ct000000-0000-0000-0000-000000000003',
    audit,
  },
  {
    id: 'en000000-0000-0000-0000-000000000003',
    employeeId: 'em000000-0000-0000-0000-000000000003',
    companyId: IDS.companySample,
    employeeCode: 'EMP100',
    isCurrent: true,
    dateOfHire: '2023-01-10',
    continuousServiceDate: '2023-01-10',
    contractTypeId: 'ct000000-0000-0000-0000-000000000002',
    audit,
  },
];

export const stageHistory: StageHistoryEntry[] = [
  {
    id: 'sh000000-0000-0000-0000-000000000001',
    employeeId: 'em000000-0000-0000-0000-000000000001',
    engagementId: 'en000000-0000-0000-0000-000000000001',
    fromStageId: null,
    toStageId: 'es000000-0000-0000-0000-000000000003',
    effectiveDate: '2021-03-01',
    reason: null,
    reviewRef: null,
    audit,
  },
  {
    id: 'sh000000-0000-0000-0000-000000000002',
    employeeId: 'em000000-0000-0000-0000-000000000002',
    engagementId: 'en000000-0000-0000-0000-000000000002',
    fromStageId: null,
    toStageId: 'es000000-0000-0000-0000-000000000002',
    effectiveDate: '2022-09-15',
    reason: null,
    reviewRef: null,
    audit,
  },
  {
    id: 'sh000000-0000-0000-0000-000000000003',
    employeeId: 'em000000-0000-0000-0000-000000000003',
    engagementId: 'en000000-0000-0000-0000-000000000003',
    fromStageId: null,
    toStageId: 'es000000-0000-0000-0000-000000000003',
    effectiveDate: '2023-01-10',
    reason: null,
    reviewRef: null,
    audit,
  },
];

export const contractTypeHistory: ContractTypeHistoryEntry[] = engagements.map((g, i) => ({
  id: `th000000-0000-0000-0000-00000000000${i + 1}`,
  employeeId: g.employeeId,
  engagementId: g.id,
  fromContractTypeId: null,
  toContractTypeId: g.contractTypeId,
  validFrom: g.dateOfHire,
  reason: null,
  audit,
}));

// John Whippy is fixed-term — his engagement carries a term row (a renewal adds a NEW row).
// Suspension WINDOWS (Epic 5 — intervals, not events; an open window has endDate null).
// Empty at seed: the demo employees are all Active; the suspend action populates it.
export const suspensionHistory: SuspensionHistoryEntry[] = [];

export const contractTerms: ContractTerm[] = [
  {
    id: 'tm000000-0000-0000-0000-000000000001',
    employeeId: 'em000000-0000-0000-0000-000000000003',
    engagementId: 'en000000-0000-0000-0000-000000000003',
    termStart: '2023-01-10',
    termEnd: '2027-01-09',
    renewalOf: null,
    signedDate: '2023-01-05',
    audit,
  },
];

/** Demo credential for the mock login. */
export const DEMO_CREDENTIALS = { loginCode: 'ADMIN001', password: 'password' };
export const DEMO_TOKEN = 'mock-jwt.tenant=11111111.user=22222222';
