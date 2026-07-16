import { useEffect } from 'react';
import { App as AntApp, DatePicker, Form, Input, InputNumber, Select, Switch } from 'antd';
import type { Dayjs } from 'dayjs';
import { FormDrawer } from '@/components';
import { isApiError } from '@/lib/apiError';
import { fromApiDate, toApiDate, DISPLAY_DATE_FORMAT } from '@/lib/date';
import type { Employee, EmployeePatch } from '@/types/api';
import { useContractTypeOptions, usePatchEmployee, usePayFrequencyOptions } from '../api/hooks';

export type EmployeeSection = 'personal' | 'statutoryTax' | 'employment' | 'payDetails';

const SECTION_TITLES: Record<EmployeeSection, string> = {
  personal: 'Personal',
  statutoryTax: 'Statutory & Tax',
  employment: 'Employment',
  payDetails: 'Pay Details',
};

interface EmployeeSectionDrawerProps {
  open: boolean;
  section: EmployeeSection;
  companyId: string;
  employee: Employee;
  onClose: () => void;
}

interface SectionFormValues {
  // personal
  firstName?: string;
  lastName?: string;
  middleName?: string;
  displayName?: string;
  dateOfBirth?: Dayjs | null;
  sex?: string;
  maritalStatus?: string;
  // statutory & tax
  tin?: string;
  fnpfNo?: string;
  taxCode?: Employee['taxCode'];
  taxType?: Employee['taxType'];
  taxCodeDeclarationDate?: Dayjs | null;
  useSpecialTaxRate?: boolean;
  specialTaxRate?: number | null;
  // employment
  contractTypeId?: string;
  continuousServiceDate?: Dayjs | null;
  probationStartDate?: Dayjs | null;
  probationEndDate?: Dayjs | null;
  // pay details
  payFrequencyId?: string | null;
  paymentMethod?: Employee['paymentMethod'] | '';
  isGrossUp?: boolean;
  standardHours?: number | null;
  salaryOtRate?: number | null;
  bankName?: string;
  bankAccountNo?: string;
  bankBranch?: string;
}

/** Blank input → explicit null (merge-patch CLEAR); the API collapses blank to null anyway. */
const orNull = (v: string | null | undefined): string | null => (v?.trim() ? v.trim() : null);

/**
 * One section of the 360 form shell (Sprint 2 Epic 2) — PATCHes ONLY its own section's fields
 * (spec §9.1 sectioned update). Position fields, rate, status and loginCode are absent by design:
 * they are owned by transfer/regrade/rate-change (Epic 6), the status action (Epic 5) and
 * enable-login (Epic 3).
 */
export function EmployeeSectionDrawer({ open, section, companyId, employee, onClose }: EmployeeSectionDrawerProps) {
  const [form] = Form.useForm<SectionFormValues>();
  const { message } = AntApp.useApp();
  const patchMutation = usePatchEmployee(companyId, employee.id);
  const contractTypes = useContractTypeOptions();
  const frequencies = usePayFrequencyOptions(companyId);
  const useSpecial = Form.useWatch('useSpecialTaxRate', form);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      firstName: employee.firstName,
      lastName: employee.lastName,
      middleName: employee.middleName ?? undefined,
      displayName: employee.displayName,
      dateOfBirth: fromApiDate(employee.dateOfBirth),
      sex: employee.sex ?? undefined,
      maritalStatus: employee.maritalStatus ?? undefined,
      tin: employee.tin ?? undefined,
      fnpfNo: employee.fnpfNo ?? undefined,
      taxCode: employee.taxCode,
      taxType: employee.taxType,
      taxCodeDeclarationDate: fromApiDate(employee.taxCodeDeclarationDate),
      useSpecialTaxRate: employee.useSpecialTaxRate ?? false,
      specialTaxRate: employee.specialTaxRate,
      contractTypeId: employee.contractTypeId ?? undefined,
      continuousServiceDate: fromApiDate(employee.continuousServiceDate),
      probationStartDate: fromApiDate(employee.probationStartDate),
      probationEndDate: fromApiDate(employee.probationEndDate),
      payFrequencyId: employee.payFrequencyId ?? undefined,
      paymentMethod: employee.paymentMethod ?? '',
      isGrossUp: employee.isGrossUp ?? false,
      standardHours: employee.standardHours,
      salaryOtRate: employee.salaryOtRate,
      bankName: employee.bankName ?? undefined,
      bankAccountNo: employee.bankAccountNo ?? undefined,
      bankBranch: employee.bankBranch ?? undefined,
    });
  }, [open, employee, form]);

  const buildPatch = (v: SectionFormValues): EmployeePatch => {
    switch (section) {
      case 'personal':
        return {
          firstName: v.firstName?.trim(),
          lastName: v.lastName?.trim(),
          middleName: orNull(v.middleName),
          displayName: orNull(v.displayName),
          dateOfBirth: toApiDate(v.dateOfBirth ?? null),
          sex: orNull(v.sex),
          maritalStatus: orNull(v.maritalStatus),
        };
      case 'statutoryTax':
        return {
          tin: orNull(v.tin),
          fnpfNo: orNull(v.fnpfNo),
          taxCode: v.taxCode,
          taxType: v.taxType,
          taxCodeDeclarationDate: toApiDate(v.taxCodeDeclarationDate ?? null),
          useSpecialTaxRate: v.useSpecialTaxRate,
          specialTaxRate: v.useSpecialTaxRate ? v.specialTaxRate : null,
        };
      case 'employment':
        return {
          contractTypeId: v.contractTypeId,
          continuousServiceDate: toApiDate(v.continuousServiceDate ?? null),
          probationStartDate: toApiDate(v.probationStartDate ?? null),
          probationEndDate: toApiDate(v.probationEndDate ?? null),
        };
      case 'payDetails':
        return {
          payFrequencyId: v.payFrequencyId ?? null,
          paymentMethod: v.paymentMethod === '' ? null : v.paymentMethod,
          isGrossUp: v.isGrossUp,
          standardHours: v.standardHours ?? null,
          salaryOtRate: v.salaryOtRate ?? null,
          bankName: orNull(v.bankName),
          bankAccountNo: orNull(v.bankAccountNo),
          bankBranch: orNull(v.bankBranch),
        };
    }
  };

  const handleSubmit = async () => {
    let values: SectionFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    try {
      await patchMutation.mutateAsync(buildPatch(values));
      message.success(`${SECTION_TITLES[section]} saved`);
      onClose();
    } catch (err) {
      if (isApiError(err) && err.fieldErrors) {
        // API field keys are camelCased to match the form item names (GlobalExceptionHandler).
        form.setFields(
          Object.entries(err.fieldErrors).map(([name, errors]) => ({
            name: name as keyof SectionFormValues,
            errors,
          })),
        );
        return;
      }
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title={`Edit ${SECTION_TITLES[section]}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={patchMutation.isPending}
      width={520}
    >
      <Form<SectionFormValues> form={form} layout="vertical" requiredMark>
        {section === 'personal' && (
          <>
            <Form.Item name="firstName" label="First name" rules={[{ required: true, whitespace: true }, { max: 100 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Last name" rules={[{ required: true, whitespace: true }, { max: 100 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="middleName" label="Middle name" rules={[{ max: 100 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="displayName" label="Display name" tooltip="Leave blank to derive from first + last name">
              <Input />
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Date of birth">
              <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} disabledDate={(d) => d.isAfter(new Date())} />
            </Form.Item>
            <Form.Item name="sex" label="Sex">
              <Select
                allowClear
                placeholder="Select"
                options={['Male', 'Female', 'Other'].map((v) => ({ value: v, label: v }))}
              />
            </Form.Item>
            <Form.Item name="maritalStatus" label="Marital status">
              <Select
                allowClear
                placeholder="Select"
                options={['Single', 'Married', 'De facto', 'Widowed', 'Divorced'].map((v) => ({ value: v, label: v }))}
              />
            </Form.Item>
          </>
        )}
        {section === 'statutoryTax' && (
          <>
            <Form.Item name="tin" label="TIN" tooltip="Format is not validated — FRCS issues these" rules={[{ max: 50 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="fnpfNo" label="FNPF #" rules={[{ max: 50 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="taxCode" label="Tax code" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'P', label: 'P — Primary' },
                  { value: 'S', label: 'S — Secondary' },
                  { value: 'None', label: 'None' },
                ]}
              />
            </Form.Item>
            <Form.Item name="taxType" label="Tax type" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'Resident', label: 'Resident' },
                  { value: 'NonResident', label: 'Non-resident' },
                ]}
              />
            </Form.Item>
            <Form.Item name="taxCodeDeclarationDate" label="TCD date" tooltip="Tax Code Declaration lodgement date">
              <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
            </Form.Item>
            <Form.Item name="useSpecialTaxRate" label="Special tax rate" valuePropName="checked">
              <Switch />
            </Form.Item>
            {useSpecial && (
              <Form.Item name="specialTaxRate" label="Special rate (%)" rules={[{ required: true, message: 'Enter the special rate' }]}>
                <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            )}
          </>
        )}
        {section === 'employment' && (
          <>
            <Form.Item name="contractTypeId" label="Contract type" rules={[{ required: true, message: 'Contract type is required' }]}>
              <Select
                loading={contractTypes.isLoading}
                options={(contractTypes.data ?? [])
                  .filter((c) => c.status !== 'Inactive' || c.id === employee.contractTypeId)
                  .map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
            <Form.Item name="continuousServiceDate" label="Continuous service date" tooltip="Anchors service-based entitlements; defaults to the hire date">
              <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
            </Form.Item>
            <Form.Item name="probationStartDate" label="Probation start">
              <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
            </Form.Item>
            <Form.Item name="probationEndDate" label="Probation end">
              <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
            </Form.Item>
          </>
        )}
        {section === 'payDetails' && (
          <>
            <Form.Item name="payFrequencyId" label="Pay frequency">
              <Select
                allowClear
                loading={frequencies.isLoading}
                placeholder="Select pay frequency"
                options={(frequencies.data ?? []).map((f) => ({ value: f.id, label: f.code }))}
              />
            </Form.Item>
            <Form.Item name="paymentMethod" label="Payment method" tooltip="Clear to unset — not settable at onboarding">
              <Select
                options={[
                  { value: '', label: '— none —' },
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Cheque', label: 'Cheque' },
                  { value: 'DirectDeposit', label: 'Direct deposit' },
                ]}
              />
            </Form.Item>
            <Form.Item name="isGrossUp" label="Gross-up" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="standardHours" label="Standard hours">
              <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="salaryOtRate" label="Salary OT rate">
              <InputNumber min={0} step={0.25} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="bankName" label="Bank" rules={[{ max: 100 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="bankAccountNo" label="Account #" rules={[{ max: 50 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="bankBranch" label="Branch" rules={[{ max: 100 }]}>
              <Input />
            </Form.Item>
          </>
        )}
      </Form>
    </FormDrawer>
  );
}
