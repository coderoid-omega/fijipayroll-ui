import { describe, it, expect } from 'vitest';
import { companyLookupWriteSchema, departmentWriteSchema } from './schema';

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
