import { useEffect } from 'react';
import { App as AntApp, Alert, Col, Form, InputNumber, Row } from 'antd';
import type { Dayjs } from 'dayjs';
import { EffectiveDateField, FormDrawer } from '@/components';
import { fromApiDate, toApiDate } from '@/lib/date';
import { isApiError } from '@/lib/apiError';
import type { FnpfScheme, FnpfSchemeWrite } from '@/types/api';
import { fnpfSchemeWriteSchema } from '../schema';
import { useCreateFnpfScheme, useUpdateFnpfScheme } from '../api/hooks';

interface FnpfSchemeFormDrawerProps {
  open: boolean;
  /** Provide to edit a Draft; omit to create a new version (optionally cloned from `cloneFrom`). */
  editing?: FnpfScheme;
  cloneFrom?: FnpfScheme;
  onClose: () => void;
}

type FormShape = Omit<FnpfSchemeWrite, 'validFrom' | 'status'> & { validFrom?: Dayjs };

function toForm(s: FnpfScheme, withDate: boolean): FormShape {
  return {
    validFrom: withDate ? (fromApiDate(s.validFrom) ?? undefined) : undefined,
    employeePct: s.employeePct,
    employerPct: s.employerPct,
    voluntaryPct: s.voluntaryPct ?? 0,
    employerExcessExemptPct: s.employerExcessExemptPct,
    wageCeiling: s.wageCeiling ?? null,
  };
}

/** Create a new FNPF scheme version (or edit a Draft) — Epic 4.2 editable. */
export function FnpfSchemeFormDrawer({ open, editing, cloneFrom, onClose }: FnpfSchemeFormDrawerProps) {
  const [form] = Form.useForm<FormShape>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(editing);

  const createMutation = useCreateFnpfScheme();
  const updateMutation = useUpdateFnpfScheme();
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue(toForm(editing, true));
    } else {
      form.resetFields();
      // New version: seed rates from the current active scheme but leave the date blank.
      form.setFieldsValue(
        cloneFrom ? toForm(cloneFrom, false) : { voluntaryPct: 0, employerExcessExemptPct: 10 },
      );
    }
  }, [open, editing, cloneFrom, form]);

  const handleSubmit = async () => {
    let values: FormShape;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const parsed = fnpfSchemeWriteSchema.safeParse({
      ...values,
      validFrom: toApiDate(values.validFrom ?? null) ?? '',
    });
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as FnpfSchemeWrite;
    try {
      if (isEdit && editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success('FNPF scheme updated');
      } else {
        await createMutation.mutateAsync(body);
        message.success('New FNPF scheme version created');
      }
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title={isEdit ? 'Edit FNPF scheme' : 'New FNPF scheme version'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save changes' : 'Create version'}
      width={460}
    >
      <Form<FormShape> form={form} layout="vertical" requiredMark>
        {!isEdit && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Creating a new version will supersede the current active scheme from its effective date. History stays immutable."
          />
        )}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="employeePct"
              label="Employee %"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={100} step={0.5} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="employerPct"
              label="Employer %"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={100} step={0.5} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="voluntaryPct" label="Voluntary %">
              <InputNumber min={0} max={100} step={0.5} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="employerExcessExemptPct"
              label="Excess tax-exempt %"
              tooltip="Employer FNPF above this % of salary is taxable to the employee (SIG 2021-32)."
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={100} step={0.5} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="wageCeiling" label="Wage ceiling (optional)">
              <InputNumber min={0} step={100} addonBefore="FJ$" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <EffectiveDateField showVersioningNote={!isEdit} />
      </Form>
    </FormDrawer>
  );
}
