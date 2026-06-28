import { useEffect } from 'react';
import {
  App as AntApp,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Skeleton,
  Switch,
  Typography,
} from 'antd';
import { FormDrawer } from '@/components';
import { zodRule } from '@/lib/zodForm';
import { isApiError } from '@/lib/apiError';
import type { Company, CompanyWrite } from '@/types/api';
import { companyWriteSchema, type CompanyFormValues } from '../schema';
import { useCompany, useCreateCompany, useUpdateCompany } from '../api/hooks';

interface CompanyFormDrawerProps {
  open: boolean;
  /** Provide an id to edit; omit to create. */
  companyId?: string;
  onClose: () => void;
}

const CREATE_DEFAULTS: Partial<CompanyFormValues> = {
  roundTo5cMode: 'None',
  employerFnpfPct: 10,
  employeeFnpfPct: 8,
  employerFnpfExcessExemptPct: 0,
  autoAddFnpfPayCode: true,
  enablePaydayReporting: true,
};

function toFormValues(c: Company): CompanyFormValues {
  return {
    code: c.code,
    name: c.name,
    legalName: c.legalName ?? undefined,
    fnpfEmployerNo: c.fnpfEmployerNo ?? undefined,
    fnpfCheckDigit: c.fnpfCheckDigit ?? undefined,
    tin: c.tin ?? undefined,
    address: {
      line1: c.address?.line1 ?? undefined,
      line2: c.address?.line2 ?? undefined,
      city: c.address?.city ?? undefined,
    },
    defaultNormalPayCode: c.defaultNormalPayCode ?? undefined,
    defaultDirectorFeeCode: c.defaultDirectorFeeCode ?? undefined,
    defaultFnpfPayCode: c.defaultFnpfPayCode ?? undefined,
    roundTo5cMode: c.roundTo5cMode ?? 'None',
    employerFnpfPct: c.employerFnpfPct ?? undefined,
    employeeFnpfPct: c.employeeFnpfPct ?? undefined,
    employerFnpfExcessExemptPct: c.employerFnpfExcessExemptPct ?? undefined,
    autoAddFnpfPayCode: c.autoAddFnpfPayCode ?? true,
    enablePaydayReporting: c.enablePaydayReporting ?? true,
  };
}

/**
 * Create/edit a company (brand) — Epic 2.2. Fields mirror the desktop "Company Details" form:
 * statutory identity (FNPF #, check digit, TIN), default pay codes, cash rounding, FNPF %s incl.
 * the SIG-2021-32 excess-exempt %, and feature flags. `isPrimary` is NOT editable here (2.3).
 */
export function CompanyFormDrawer({ open, companyId, onClose }: CompanyFormDrawerProps) {
  const [form] = Form.useForm<CompanyFormValues>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(companyId);

  const companyQuery = useCompany(open && isEdit ? companyId : undefined);
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const submitting = createMutation.isPending || updateMutation.isPending;

  // Reset/populate the form whenever the drawer opens (create) or data lands (edit).
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      if (companyQuery.data) form.setFieldsValue(toFormValues(companyQuery.data));
    } else {
      form.resetFields();
      form.setFieldsValue(CREATE_DEFAULTS);
    }
  }, [open, isEdit, companyQuery.data, form]);

  const applyServerErrors = (err: unknown) => {
    if (isApiError(err) && err.fieldErrors) {
      const fields = Object.entries(err.fieldErrors).map(([name, errors]) => ({
        name: name.includes('.') ? name.split('.') : name,
        errors,
      }));
      form.setFields(fields as unknown as Parameters<typeof form.setFields>[0]);
      return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    let values: CompanyFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return; // field-level errors already shown
    }
    const parsed = companyWriteSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as CompanyWrite;
    try {
      if (isEdit && companyId) {
        await updateMutation.mutateAsync({ id: companyId, body });
        message.success('Company updated');
      } else {
        await createMutation.mutateAsync(body);
        message.success('Company created');
      }
      onClose();
    } catch (err) {
      if (applyServerErrors(err)) return;
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  const loadingExisting = isEdit && companyQuery.isLoading;

  return (
    <FormDrawer
      open={open}
      title={isEdit ? 'Edit company' : 'New company'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save changes' : 'Create company'}
      width={600}
    >
      {loadingExisting ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <Form<CompanyFormValues> form={form} layout="vertical" requiredMark>
          <Typography.Text type="secondary">Identity</Typography.Text>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="Code" rules={[zodRule(companyWriteSchema.shape.code)]}>
                <Input placeholder="e.g. DEMO" disabled={isEdit} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Name" rules={[zodRule(companyWriteSchema.shape.name)]}>
                <Input placeholder="Trading name" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="legalName" label="Legal name">
            <Input placeholder="Registered legal entity name" />
          </Form.Item>

          <Typography.Text type="secondary">Statutory identity (per brand)</Typography.Text>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fnpfEmployerNo" label="FNPF employer #">
                <Input placeholder="FNPF-xxxxxx" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="fnpfCheckDigit"
                label="Check digit"
                tooltip="Single character issued by FNPF; required for FNPF e-submission."
                rules={[zodRule(companyWriteSchema.shape.fnpfCheckDigit)]}
              >
                <Input maxLength={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tin" label="TIN">
                <Input placeholder="xx-xxxxx-x-x" />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text type="secondary">Address</Typography.Text>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Form.Item name={['address', 'line1']} label="Address line 1">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['address', 'line2']} label="Address line 2">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['address', 'city']} label="City / Town">
                <Input placeholder="e.g. Suva" />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text type="secondary">Default pay codes</Typography.Text>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="defaultNormalPayCode" label="Normal">
                <Input placeholder="101" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="defaultDirectorFeeCode" label="Director fee">
                <Input placeholder="190" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="defaultFnpfPayCode" label="FNPF">
                <Input placeholder="301" />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text type="secondary">FNPF & rounding</Typography.Text>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="employerFnpfPct"
                label="Employer FNPF %"
                rules={[zodRule(companyWriteSchema.shape.employerFnpfPct)]}
              >
                <InputNumber min={0} max={100} step={0.5} addonAfter="%" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="employeeFnpfPct"
                label="Employee FNPF %"
                rules={[zodRule(companyWriteSchema.shape.employeeFnpfPct)]}
              >
                <InputNumber min={0} max={100} step={0.5} addonAfter="%" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="employerFnpfExcessExemptPct"
                label="Excess tax-exempt %"
                tooltip="Employer FNPF above this % of salary is taxable to the employee (FRCS SIG 2021-32)."
                rules={[zodRule(companyWriteSchema.shape.employerFnpfExcessExemptPct)]}
              >
                <InputNumber min={0} max={100} step={0.5} addonAfter="%" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="roundTo5cMode"
            label="Round pay to nearest 5c"
            tooltip="Cash-rounding rule (desktop: 'Cash Pay Only')."
          >
            <Select
              options={[
                { value: 'None', label: 'No rounding' },
                { value: 'CashOnly', label: 'Cash pay only' },
                { value: 'All', label: 'All payments' },
              ]}
            />
          </Form.Item>

          <Typography.Text type="secondary">Feature flags</Typography.Text>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Form.Item name="autoAddFnpfPayCode" label="Auto-add FNPF pay code" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="enablePaydayReporting"
            label="Enable Payday Reporting (FRCS TPOS)"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      )}
    </FormDrawer>
  );
}
