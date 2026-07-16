import { describe, it, expect } from 'vitest';
import type { Employee } from '@/types/api';
import { overallCompleteness, sectionScores } from './profileCompleteness';

// Mirrors the API's defined rule (EmployeeProfileCompleteness.cs): 17 fields, sections 5/4/3/5,
// round(100 × populated ÷ 17). If these numbers move, the API map moved — change BOTH or neither.

const minimalCore: Employee = {
  id: 'e1',
  companyId: 'c1',
  employeeCode: 'EMP001',
  displayName: 'Ana Rokotui',
  firstName: 'Ana',
  lastName: 'Rokotui',
  status: 'Active',
  taxCode: 'S',
  contractTypeId: 'ct1',
  dateOfHire: '2026-07-01',
  payType: 'Salary',
  salaryPerPeriod: 2500,
};

const complete: Employee = {
  ...minimalCore,
  dateOfBirth: '1994-02-03',
  sex: 'Female',
  maritalStatus: 'Single',
  tin: '51-22233-4-5',
  fnpfNo: 'FNPF-661204',
  taxCodeDeclarationDate: '2026-07-01',
  stageId: 's1',
  payFrequencyId: 'f1',
  paymentMethod: 'DirectDeposit',
  bankName: 'ANZ',
  bankAccountNo: '1234567',
};

describe('profileCompleteness (UI mirror of the API rule)', () => {
  it('sections are 5/4/3/5 = 17 fields', () => {
    expect(sectionScores(complete).map((s) => s.total)).toEqual([5, 4, 3, 5]);
  });

  it('the minimal required core scores 41%', () => {
    expect(overallCompleteness(minimalCore)).toBe(41); // 7 of 17 — matches the API test
  });

  it('a fully completed core scores 100%', () => {
    expect(overallCompleteness(complete)).toBe(100);
    expect(sectionScores(complete).every((s) => s.populated === s.total)).toBe(true);
  });

  it('the rate must match the pay type', () => {
    const hourlyWithoutRate: Employee = { ...complete, payType: 'Hourly', hourlyRate: null };
    const pay = sectionScores(hourlyWithoutRate).find((s) => s.key === 'payDetails')!;
    expect(pay.populated).toBe(pay.total - 1);
  });

  it('bank counts only when name AND account are present', () => {
    const nameOnly: Employee = { ...complete, bankAccountNo: null };
    const pay = sectionScores(nameOnly).find((s) => s.key === 'payDetails')!;
    expect(pay.populated).toBe(pay.total - 1);
  });
});
