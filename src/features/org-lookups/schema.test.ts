import { describe, it, expect } from 'vitest';
import {
  companyLookupWriteSchema,
  contractTypeWriteSchema,
  departmentWriteSchema,
  employmentStageWriteSchema,
  exitReasonWriteSchema,
} from './schema';

describe('departmentWriteSchema', () => {
  it('accepts a valid department', () => {
    const result = departmentWriteSchema.safeParse({ code: 'FIN', name: 'Finance' });
    expect(result.success).toBe(true);
  });

  it('requires code and name', () => {
    expect(departmentWriteSchema.safeParse({ code: '', name: '' }).success).toBe(false);
  });

  it('rejects invalid code characters', () => {
    expect(departmentWriteSchema.safeParse({ code: 'a b', name: 'X' }).success).toBe(false);
  });

  it('accepts a null parent (top-level)', () => {
    const result = departmentWriteSchema.safeParse({
      code: 'FIN',
      name: 'Finance',
      parentDepartmentId: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-uuid parent id', () => {
    const result = departmentWriteSchema.safeParse({
      code: 'FIN',
      name: 'Finance',
      parentDepartmentId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('companyLookupWriteSchema (division/section/grade/level)', () => {
  it('accepts name with a code', () => {
    expect(companyLookupWriteSchema.safeParse({ code: 'WD', name: 'Western' }).success).toBe(true);
  });

  it('accepts name without a code (code is optional)', () => {
    expect(companyLookupWriteSchema.safeParse({ name: 'Western' }).success).toBe(true);
    expect(companyLookupWriteSchema.safeParse({ code: '', name: 'Western' }).success).toBe(true);
  });

  it('requires a name', () => {
    expect(companyLookupWriteSchema.safeParse({ code: 'WD', name: '' }).success).toBe(false);
  });

  it('rejects invalid code characters when a code is given', () => {
    expect(companyLookupWriteSchema.safeParse({ code: 'a b', name: 'X' }).success).toBe(false);
  });
});

describe('contractTypeWriteSchema (Sprint 2 Epic 1)', () => {
  it('accepts a minimal contract type (flags optional)', () => {
    expect(contractTypeWriteSchema.safeParse({ code: 'PERM', name: 'Permanent' }).success).toBe(true);
  });

  it('accepts the full shape', () => {
    const result = contractTypeWriteSchema.safeParse({
      code: 'FIXED',
      name: 'Fixed-term',
      isFixedTerm: true,
      status: 'Active',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown status', () => {
    expect(
      contractTypeWriteSchema.safeParse({ code: 'X', name: 'X', status: 'Archived' }).success,
    ).toBe(false);
  });
});

describe('employmentStageWriteSchema (Sprint 2 Epic 1)', () => {
  it('accepts a stage with ordinal and probation flag', () => {
    const result = employmentStageWriteSchema.safeParse({
      code: 'PROB',
      name: 'Probation',
      ordinal: 2,
      isProbationary: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative ordinal', () => {
    expect(
      employmentStageWriteSchema.safeParse({ code: 'X', name: 'X', ordinal: -1 }).success,
    ).toBe(false);
  });
});

describe('exitReasonWriteSchema (Sprint 2 Epic 1 — the flags are the behaviour, D10)', () => {
  it('accepts a full exit reason', () => {
    const result = exitReasonWriteSchema.safeParse({
      code: 'REDUND',
      name: 'Redundancy',
      initiator: 'Employer',
      severanceEligible: true,
      noticeRequired: true,
      rehireEligible: true,
    });
    expect(result.success).toBe(true);
  });

  it('requires an initiator', () => {
    expect(exitReasonWriteSchema.safeParse({ code: 'RESIGN', name: 'Resignation' }).success).toBe(
      false,
    );
  });

  it('rejects an unknown initiator', () => {
    expect(
      exitReasonWriteSchema.safeParse({ code: 'X', name: 'X', initiator: 'Bogus' }).success,
    ).toBe(false);
  });

  it('flags are optional (server defaults: severance false, notice true, rehire true)', () => {
    expect(
      exitReasonWriteSchema.safeParse({ code: 'RETIRE', name: 'Retirement', initiator: 'Neither' })
        .success,
    ).toBe(true);
  });
});
