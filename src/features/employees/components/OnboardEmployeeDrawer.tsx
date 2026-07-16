import { useEffect } from 'react';
import { App as AntApp, DatePicker, Form, Input, InputNumber, Select, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
import { FormDrawer } from '@/components';
import { isApiError } from '@/lib/apiError';
import { toApiDate, DISPLAY_DATE_FORMAT } from '@/lib/date';
import type { EmployeeCreate, PayType, TaxCode } from '@/types/api';
import {
  useContractTypeOptions,
  useCreateEmployee,
  useEmploymentStageOptions,
  usePayFrequencyOptions,
} from '../api/hooks';

interface OnboardFormValues {
  employeeCode?: string;
  firstName: string;
  lastName: string;
  contractTypeId: string;
  stageId?: string;
  dateOfHire: Dayjs;
  payType: PayType;
  hourlyRate?: number;
  salaryPerPeriod?: number;
  payFrequencyId?: string;
  taxCode: TaxCode;
  tin?: string;
  fnpfNo?: string;
  dateOfBirth?: Dayjs;
}

interface OnboardEmployeeDrawerProps {
  open: boolean;
  companyId: string;
  onClose: () => void;
}

/**
 * Onboarding (Sprint 2 Epic 2) — the MINIMAL required core only (OQ-04); everything else is
 * "save and complete later" on the 360 form. Duplicate employee code (409) and validation
 * failures (422) land as field-level errors, not a toast blob.
 */
export function OnboardEmployeeDrawer({ open, companyId, onClose }: OnboardEmployeeDrawerProps) {
  const [form] = Form.useForm<OnboardFormValues>();
  const { message } = AntApp.useApp();
  const navigate = useNavigate();

  const contractTypes = useContractTypeOptions();
  const stages = useEmploymentStageOptions();
  const frequencies = usePayFrequencyOptions(companyId);
  const createMutation = useCreateEmployee(companyId);

  const payType = Form.useWatch('payType', form);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ payType: 'Salary', taxCode: 'S' });
  }, [open, form]);

  const handleSubmit = async () => {
    let values: OnboardFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const body: EmployeeCreate = {
      employeeCode: values.employeeCode?.trim() || null,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      contractTypeId: values.contractTypeId,
      stageId: values.stageId ?? null,
      dateOfHire: toApiDate(values.dateOfHire)!,
      payType: values.payType,
      hourlyRate: values.payType === 'Hourly' ? values.hourlyRate : null,
      salaryPerPeriod: values.payType === 'Salary' ? values.salaryPerPeriod : null,
      payFrequencyId: values.payFrequencyId ?? null,
      taxCode: values.taxCode,
      tin: values.tin?.trim() || null,
      fnpfNo: values.fnpfNo?.trim() || null,
      dateOfBirth: toApiDate(values.dateOfBirth),
    };

    try {
      const created = await createMutation.mutateAsync(body);
      message.success(`${created.displayName} onboarded as ${created.employeeCode} — complete the profile any time`);
      onClose();
      navigate(`/employees/${created.id}`);
    } catch (err) {
      if (isApiError(err)) {
        if (err.errorCode === 'EMPLOYEE_CODE_DUPLICATE') {
          form.setFields([{ name: 'employeeCode', errors: [err.message] }]);
          return;
        }
        if (err.fieldErrors) {
          // API field keys are camelCased to match the form item names (GlobalExceptionHandler).
          form.setFields(
            Object.entries(err.fieldErrors).map(([name, errors]) => ({
              name: name as keyof OnboardFormValues,
              errors,
            })),
          );
          return;
        }
        message.error(err.message);
        return;
      }
      message.error('Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title="Onboard employee"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending}
      submitText="Onboard employee"
      width={520}
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Only the core is required here — the rest of the 360 profile is completed later, section by
        section (the completeness indicator tracks it).
      </Typography.Paragraph>
      <Form<OnboardFormValues> form={form} layout="vertical" requiredMark>
        <Form.Item
          name="employeeCode"
          label="Employee code"
          tooltip="Unique within this company. Leave blank to allocate the next code from the company sequence."
          rules={[
            { pattern: /^[A-Za-z0-9_-]*$/, message: 'Use letters, numbers, dash or underscore only' },
            { max: 20, message: 'Code is too long' },
          ]}
        >
          <Input placeholder="Leave blank to auto-generate (e.g. EMP007)" />
        </Form.Item>
        <Form.Item name="firstName" label="First name" rules={[{ required: true, whitespace: true, message: 'First name is required' }, { max: 100 }]}>
          <Input />
        </Form.Item>
        <Form.Item name="lastName" label="Last name" rules={[{ required: true, whitespace: true, message: 'Last name is required' }, { max: 100 }]}>
          <Input />
        </Form.Item>
        <Form.Item name="contractTypeId" label="Contract type" rules={[{ required: true, message: 'Contract type is required' }]}>
          <Select
            loading={contractTypes.isLoading}
            placeholder="Select contract type"
            options={(contractTypes.data ?? [])
              .filter((c) => c.status !== 'Inactive')
              .map((c) => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="stageId" label="Employment stage" tooltip="Optional at onboarding — e.g. Probation">
          <Select
            allowClear
            loading={stages.isLoading}
            placeholder="Select stage (optional)"
            options={(stages.data ?? [])
              .filter((s) => s.status !== 'Inactive')
              .map((s) => ({ value: s.id, label: s.name }))}
          />
        </Form.Item>
        <Form.Item name="dateOfHire" label="Date of hire" rules={[{ required: true, message: 'Date of hire is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="payType" label="Pay type" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'Salary', label: 'Salary' },
              { value: 'Hourly', label: 'Hourly' },
            ]}
          />
        </Form.Item>
        {payType === 'Hourly' ? (
          <Form.Item name="hourlyRate" label="Hourly rate (FJD)" rules={[{ required: true, message: 'Hourly rate is required' }]}>
            <InputNumber min={0.01} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        ) : (
          <Form.Item name="salaryPerPeriod" label="Salary per period (FJD)" rules={[{ required: true, message: 'Salary per period is required' }]}>
            <InputNumber min={0.01} step={100} style={{ width: '100%' }} />
          </Form.Item>
        )}
        <Form.Item name="payFrequencyId" label="Pay frequency">
          <Select
            allowClear
            loading={frequencies.isLoading}
            placeholder="Select pay frequency (optional)"
            options={(frequencies.data ?? []).map((f) => ({ value: f.id, label: f.code }))}
          />
        </Form.Item>
        <Form.Item name="taxCode" label="Tax code" rules={[{ required: true }]} tooltip="P = primary employment, S = secondary">
          <Select
            options={[
              { value: 'P', label: 'P — Primary' },
              { value: 'S', label: 'S — Secondary' },
              { value: 'None', label: 'None' },
            ]}
          />
        </Form.Item>
        <Form.Item name="tin" label="TIN" tooltip="Optional at onboarding — required before the first payroll run">
          <Input />
        </Form.Item>
        <Form.Item name="fnpfNo" label="FNPF #" tooltip="Optional at onboarding — required before the first payroll run">
          <Input />
        </Form.Item>
        <Form.Item name="dateOfBirth" label="Date of birth">
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} disabledDate={(d) => d.isAfter(new Date())} />
        </Form.Item>
      </Form>
    </FormDrawer>
  );
}
