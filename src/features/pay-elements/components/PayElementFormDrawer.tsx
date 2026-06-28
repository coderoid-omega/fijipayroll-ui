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
import type { Dayjs } from 'dayjs';
import { EffectiveDateField, FormDrawer } from '@/components';
import { zodRule } from '@/lib/zodForm';
import { fromApiDate, toApiDate } from '@/lib/date';
import { isApiError } from '@/lib/apiError';
import type { CalcType, PayElement, PayElementWrite, PayGroup } from '@/types/api';
import { payElementWriteSchema } from '../schema';
import { useCreatePayElement, usePayElement, useUpdatePayElement } from '../api/hooks';

interface PayElementFormDrawerProps {
  open: boolean;
  companyId: string;
  payGroups: PayGroup[];
  elementId?: string;
  onClose: () => void;
}

/** Internal form shape — validFrom is a Dayjs in the picker, serialised on submit. */
type FormShape = Omit<PayElementWrite, 'validFrom'> & { validFrom?: Dayjs };

const CALC_TYPES: { value: CalcType; label: string }[] = [
  { value: 'Hour', label: 'Hour (hours × rate × E-Rate)' },
  { value: 'Dollar', label: 'Dollar (fixed amount)' },
  { value: 'Percent', label: 'Percent (% of base)' },
  { value: 'Multiplier', label: 'Multiplier (× regular rate)' },
];

const CREATE_DEFAULTS: Partial<FormShape> = {
  calcType: 'Hour',
  eRate: 1,
  isPayeAble: true,
  isFnpfAble: true,
  isOneTimeForTax: false,
  isPreTax: false,
  isPostTax: false,
  showOnPayslip: true,
  hasGoalAmount: false,
};

function toFormValues(e: PayElement): FormShape {
  return {
    code: e.code,
    description: e.description,
    payGroupCode: e.payGroupCode,
    calcType: e.calcType,
    eRate: e.eRate,
    isPayeAble: e.isPayeAble ?? true,
    isFnpfAble: e.isFnpfAble ?? true,
    isOneTimeForTax: e.isOneTimeForTax ?? false,
    isPreTax: e.isPreTax ?? false,
    isPostTax: e.isPostTax ?? false,
    showOnPayslip: e.showOnPayslip ?? true,
    hasGoalAmount: e.hasGoalAmount ?? false,
    quickEntryColumnNo: e.quickEntryColumnNo ?? null,
    validFrom: fromApiDate(e.validFrom) ?? undefined,
  };
}

/**
 * Create/edit a pay element — Epic 3.3. Editing creates a new effective-dated version
 * (immutability surfaced via EffectiveDateField). Visual reference: admin-configuration.html.
 */
export function PayElementFormDrawer({
  open,
  companyId,
  payGroups,
  elementId,
  onClose,
}: PayElementFormDrawerProps) {
  const [form] = Form.useForm<FormShape>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(elementId);

  const elementQuery = usePayElement(companyId, open && isEdit ? elementId : undefined);
  const createMutation = useCreatePayElement(companyId);
  const updateMutation = useUpdatePayElement(companyId);
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      if (elementQuery.data) form.setFieldsValue(toFormValues(elementQuery.data));
    } else {
      form.resetFields();
      form.setFieldsValue(CREATE_DEFAULTS);
    }
  }, [open, isEdit, elementQuery.data, form]);

  const handleSubmit = async () => {
    let values: FormShape;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const candidate = { ...values, validFrom: toApiDate(values.validFrom ?? null) ?? '' };
    const parsed = payElementWriteSchema.safeParse(candidate);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as PayElementWrite;
    try {
      if (isEdit && elementId) {
        await updateMutation.mutateAsync({ id: elementId, body });
        message.success('Pay element updated (new version)');
      } else {
        await createMutation.mutateAsync(body);
        message.success('Pay element created');
      }
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  const loadingExisting = isEdit && elementQuery.isLoading;

  return (
    <FormDrawer
      open={open}
      title={isEdit ? 'Edit pay element' : 'New pay element'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save new version' : 'Create pay element'}
      width={600}
    >
      {loadingExisting ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <Form<FormShape> form={form} layout="vertical" requiredMark>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="code"
                label="Code"
                rules={[zodRule(payElementWriteSchema.shape.code)]}
              >
                <Input placeholder="e.g. 101" disabled={isEdit} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="description"
                label="Description"
                rules={[zodRule(payElementWriteSchema.shape.description)]}
              >
                <Input placeholder="e.g. Regular" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="payGroupCode"
                label="Pay group"
                rules={[{ required: true, message: 'Pay group is required' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select a pay group"
                  options={payGroups.map((g) => ({ value: g.code, label: `${g.code} — ${g.name}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="calcType"
                label="Type"
                rules={[{ required: true, message: 'Type is required' }]}
              >
                <Select options={CALC_TYPES} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="eRate"
                label="E-Rate (multiplier)"
                tooltip="Total = Hours × Rate × E-Rate. e.g. 1.5 for time-and-a-half, 2 for double time."
                rules={[zodRule(payElementWriteSchema.shape.eRate)]}
              >
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quickEntryColumnNo"
                label="Quick-entry column #"
                tooltip="Inline column in the pay register (1–10); leave blank for none."
              >
                <InputNumber min={0} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text type="secondary">Tax & contribution treatment</Typography.Text>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isPayeAble" label="PAYE-able" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isFnpfAble" label="FNPF-able" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isOneTimeForTax"
                label="One-time for tax"
                tooltip="Excluded from PAYE annualization (e.g. bonus, time-and-a-half)."
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="showOnPayslip" label="Show on payslip" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isPreTax" label="Pre-tax (deduction)" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isPostTax" label="Post-tax (deduction)" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hasGoalAmount"
                label="Goal amount"
                tooltip="Recurring deduction that auto-stops once a target is reached (e.g. a loan)."
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text type="secondary">Effective date</Typography.Text>
          <Divider style={{ margin: '8px 0 16px' }} />
          <EffectiveDateField />
        </Form>
      )}
    </FormDrawer>
  );
}
