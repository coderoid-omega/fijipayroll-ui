import { Alert, DatePicker, Form, Space } from 'antd';
import { DISPLAY_DATE_FORMAT } from '@/lib/date';

interface EffectiveDateFieldProps {
  name?: string;
  label?: string;
  required?: boolean;
  /** Show the "edits create a new version" immutability note (CLAUDE.md §5). */
  showVersioningNote?: boolean;
  disabled?: boolean;
}

/**
 * Effective-from date control for effective-dated config (tax rule sets, FNPF, pay elements).
 * Surfaces the rule that editing creates a NEW version and history stays immutable (D8/D10).
 * Use inside an AntD Form; the value is a Dayjs — convert with `toApiDate` on submit.
 */
export function EffectiveDateField({
  name = 'validFrom',
  label = 'Effective from',
  required = true,
  showVersioningNote = true,
  disabled,
}: EffectiveDateFieldProps) {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      <Form.Item
        name={name}
        label={label}
        rules={required ? [{ required: true, message: 'Effective-from date is required' }] : []}
        style={{ marginBottom: showVersioningNote ? 8 : undefined }}
      >
        <DatePicker
          style={{ width: '100%' }}
          format={DISPLAY_DATE_FORMAT}
          disabled={disabled}
          allowClear={!required}
        />
      </Form.Item>
      {showVersioningNote && (
        <Alert
          type="info"
          showIcon
          message="Saving creates a new effective-dated version. Earlier versions stay immutable so historical payroll runs are unaffected."
        />
      )}
    </Space>
  );
}
