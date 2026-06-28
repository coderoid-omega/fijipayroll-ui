import type { Rule } from 'antd/es/form';
import type { ZodTypeAny } from 'zod';

/**
 * Adapt a Zod field schema to an AntD Form `Rule` (CLAUDE.md §2/§5 — Zod is the single source of
 * validation truth, used via AntD Form's validator). Attach to a Form.Item's `rules`.
 *
 *   <Form.Item name="code" rules={[zodRule(companyWriteSchema.shape.code)]}>
 */
export function zodRule(schema: ZodTypeAny, message?: string): Rule {
  return {
    validator: async (_rule, value: unknown) => {
      const result = schema.safeParse(value);
      if (!result.success) {
        throw new Error(message ?? result.error.issues[0]?.message ?? 'Invalid value');
      }
    },
  };
}
