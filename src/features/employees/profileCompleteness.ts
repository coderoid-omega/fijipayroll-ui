import type { Employee } from '@/types/api';

/**
 * THE profile-completeness section→field map — the UI mirror of the API's defined rule
 * (`fijipayroll-api/src/Modules/Employees/Application/EmployeeProfileCompleteness.cs`).
 * Change BOTH or neither. 17 fields across the four 360 sections; a field is populated when
 * non-null; composites: rate = the rate matching payType, bank = name AND account number.
 * The API's `profileCompleteness` is authoritative for the overall % — this map exists for the
 * PER-SECTION indicator, which the contract does not carry.
 */
export interface SectionScore {
  key: 'personal' | 'statutoryTax' | 'employment' | 'payDetails';
  label: string;
  populated: number;
  total: number;
}

const has = (v: unknown): boolean => v !== null && v !== undefined && v !== '';

export function sectionScores(e: Employee): SectionScore[] {
  const personal = [has(e.firstName), has(e.lastName), has(e.dateOfBirth), has(e.sex), has(e.maritalStatus)];
  const statutoryTax = [has(e.taxCode), has(e.tin), has(e.fnpfNo), has(e.taxCodeDeclarationDate)];
  const employment = [has(e.dateOfHire), has(e.contractTypeId), has(e.stageId)];
  const payDetails = [
    has(e.payType),
    e.payType === 'Hourly' ? has(e.hourlyRate) : has(e.salaryPerPeriod),
    has(e.payFrequencyId),
    has(e.paymentMethod),
    has(e.bankName) && has(e.bankAccountNo),
  ];

  const score = (key: SectionScore['key'], label: string, flags: boolean[]): SectionScore => ({
    key,
    label,
    populated: flags.filter(Boolean).length,
    total: flags.length,
  });

  return [
    score('personal', 'Personal', personal),
    score('statutoryTax', 'Statutory & Tax', statutoryTax),
    score('employment', 'Employment', employment),
    score('payDetails', 'Pay Details', payDetails),
  ];
}

/** Same formula as the API: round(100 × populated ÷ 17). Prefer the API's value when present. */
export function overallCompleteness(e: Employee): number {
  const sections = sectionScores(e);
  const populated = sections.reduce((sum, s) => sum + s.populated, 0);
  const total = sections.reduce((sum, s) => sum + s.total, 0);
  return Math.round((100 * populated) / total);
}
