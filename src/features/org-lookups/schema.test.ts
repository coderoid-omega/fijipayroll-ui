import { describe, it, expect } from 'vitest';
import { departmentWriteSchema } from './schema';

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
