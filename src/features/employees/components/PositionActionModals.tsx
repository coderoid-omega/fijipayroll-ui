import { useEffect } from 'react';
import { App as AntApp, Alert, DatePicker, Form, Input, InputNumber, Modal, Radio, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { isApiError } from '@/lib/apiError';
import { toApiDate, DISPLAY_DATE_FORMAT } from '@/lib/date';
import type { Employee, PayType } from '@/types/api';
import {
  useGradeOptions,
  useLevelOptions,
  useOccupationOptions,
  useRateChange,
  useRegrade,
} from '../api/hooks';

// Sprint 2 Epic 6 — position actions on two of the three axes (transfer/placement is Epic 8).
// Each writes ONE row to its own table; backdating is ALLOWED (the server resolves the cache
// as-of today, so a backdated row that isn't the latest never clobbers current values, and a
// future-dated raise applies on its date, not before). Duplicate date per axis → 409.

export type PositionAction = 'regrade' | 'rate-change';

interface ActionModalProps {
  open: boolean;
  companyId: string;
  employee: Employee;
  onClose: () => void;
}

/**
 * Regrade (JOB axis — what you ARE): occupation / grade / level. Occupation is tenant-wide;
 * grade and level are company-scoped. At least one field is required (an empty regrade is a 422).
 */
export function RegradeModal({ open, companyId, employee, onClose }: ActionModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{
    occupationId?: string | null;
    gradeId?: string | null;
    levelId?: string | null;
    validFrom: Dayjs;
    reason?: string;
  }>();
  const occupations = useOccupationOptions();
  const grades = useGradeOptions(companyId);
  const levels = useLevelOptions(companyId);
  const regrade = useRegrade(companyId, employee.id);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const submit = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    if (!v.occupationId && !v.gradeId && !v.levelId) {
      message.error('Supply at least one of occupation, grade or level.');
      return;
    }
    try {
      await regrade.mutateAsync({
        occupationId: v.occupationId ?? null,
        gradeId: v.gradeId ?? null,
        levelId: v.levelId ?? null,
        validFrom: toApiDate(v.validFrom)!,
        reason: v.reason?.trim() || null,
      });
      message.success('Regrade recorded');
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'REGRADE_DATE_CONFLICT') {
        form.setFields([{ name: 'validFrom', errors: [err.message] }]);
        return;
      }
      message.error(isApiError(err) ? err.message : 'Regrade failed');
    }
  };

  return (
    <Modal open={open} title="Regrade" okText="Record regrade" onOk={submit} onCancel={onClose}
      confirmLoading={regrade.isPending} destroyOnClose>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Backdating is allowed"
        description="A backdated regrade never overwrites a later one, and a future-dated regrade applies on its date. Every regrade is a new row on the job timeline."
      />
      <Form form={form} layout="vertical">
        <Form.Item name="occupationId" label="Designation (occupation)">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            loading={occupations.isLoading}
            placeholder="Unchanged"
            options={(occupations.data ?? []).map((o) => ({ value: o.id, label: o.name }))}
          />
        </Form.Item>
        <Form.Item name="gradeId" label="Grade">
          <Select
            allowClear
            loading={grades.isLoading}
            placeholder="Unchanged"
            options={(grades.data ?? []).map((g) => ({ value: g.id, label: g.name }))}
          />
        </Form.Item>
        <Form.Item name="levelId" label="Level">
          <Select
            allowClear
            loading={levels.isLoading}
            placeholder="Unchanged"
            options={(levels.data ?? []).map((l) => ({ value: l.id, label: l.name }))}
          />
        </Form.Item>
        <Form.Item name="validFrom" label="Effective date" rules={[{ required: true, message: 'Effective date is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="reason" label="Reason" rules={[{ max: 500 }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/**
 * Rate change (RATE axis — what you're PAID): Sprint 3/4's retro-pay input. The rate must match
 * the pay type. Backdating is allowed and correct for every later date — rate lives on its own
 * axis, so no other row goes stale. No minimum-wage gate (OQ-23 is open).
 */
export function RateChangeModal({ open, companyId, employee, onClose }: ActionModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{
    payType: PayType;
    hourlyRate?: number | null;
    salaryPerPeriod?: number | null;
    validFrom: Dayjs;
    reason?: string;
  }>();
  const rateChange = useRateChange(companyId, employee.id);
  const payType = Form.useWatch('payType', form);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ payType: employee.payType ?? 'Salary' });
    }
  }, [open, form, employee.payType]);

  const submit = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    try {
      await rateChange.mutateAsync({
        payType: v.payType,
        hourlyRate: v.payType === 'Hourly' ? v.hourlyRate ?? null : null,
        salaryPerPeriod: v.payType === 'Salary' ? v.salaryPerPeriod ?? null : null,
        validFrom: toApiDate(v.validFrom)!,
        reason: v.reason?.trim() || null,
      });
      message.success('Rate change recorded');
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'RATE_CHANGE_DATE_CONFLICT') {
        form.setFields([{ name: 'validFrom', errors: [err.message] }]);
        return;
      }
      message.error(isApiError(err) ? err.message : 'Rate change failed');
    }
  };

  return (
    <Modal open={open} title="Change rate" okText="Record rate change" onOk={submit} onCancel={onClose}
      confirmLoading={rateChange.isPending} destroyOnClose>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Enter a raise in advance, or correct one in the past"
        description="A future-dated rate applies on its effective date, not today. A backdated rate is correct for every later date — this is the engine's retro-pay input."
      />
      <Form form={form} layout="vertical" initialValues={{ payType: 'Salary' }}>
        <Form.Item name="payType" label="Pay type" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio.Button value="Salary">Salary</Radio.Button>
            <Radio.Button value="Hourly">Hourly</Radio.Button>
          </Radio.Group>
        </Form.Item>
        {payType === 'Hourly' ? (
          <Form.Item name="hourlyRate" label="Hourly rate (FJD)" rules={[{ required: true, message: 'Hourly rate is required' }]}>
            <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        ) : (
          <Form.Item name="salaryPerPeriod" label="Salary per period (FJD)" rules={[{ required: true, message: 'Salary is required' }]}>
            <InputNumber min={0} step={50} style={{ width: '100%' }} />
          </Form.Item>
        )}
        <Form.Item name="validFrom" label="Effective date" rules={[{ required: true, message: 'Effective date is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="reason" label="Reason" rules={[{ max: 500 }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
