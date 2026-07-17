import { useEffect } from 'react';
import { App as AntApp, Alert, DatePicker, Form, Input, Modal, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { isApiError } from '@/lib/apiError';
import { toApiDate, DISPLAY_DATE_FORMAT } from '@/lib/date';
import type { Employee } from '@/types/api';
import {
  useChangeContractType,
  useChangeStage,
  useContractTypeOptions,
  useCreateContractTerm,
  useEmploymentStageOptions,
  useExtendProbation,
} from '../api/hooks';

// Sprint 2 Epic 4 — the engagement actions. These (not PATCH) own the employee's
// contract-type / stage / probation fields: each writes the history row + the engagement +
// the cache in one server-side transaction, so the timeline and the caches cannot diverge.

export type LifecycleAction = 'stage-change' | 'extend-probation' | 'contract-change' | 'contract-term';

interface ActionModalProps {
  open: boolean;
  companyId: string;
  employee: Employee;
  onClose: () => void;
}

/** Moves the employee to a new stage (Trainee → Probation → Confirmed). One history row per
 * effective date per engagement — a duplicate date is a 409, surfaced on the date field. */
export function StageChangeModal({ open, companyId, employee, onClose }: ActionModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{ toStageId: string; effectiveDate: Dayjs; reason?: string; reviewRef?: string }>();
  const stages = useEmploymentStageOptions();
  const changeStage = useChangeStage(companyId, employee.id);

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
    try {
      await changeStage.mutateAsync({
        toStageId: v.toStageId,
        effectiveDate: toApiDate(v.effectiveDate)!,
        reason: v.reason?.trim() || null,
        reviewRef: v.reviewRef?.trim() || null,
      });
      message.success('Stage changed');
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'STAGE_CHANGE_DATE_CONFLICT') {
        form.setFields([{ name: 'effectiveDate', errors: [err.message] }]);
        return;
      }
      message.error(isApiError(err) ? err.message : 'Stage change failed');
    }
  };

  return (
    <Modal open={open} title="Change stage" okText="Change stage" onOk={submit} onCancel={onClose}
      confirmLoading={changeStage.isPending} destroyOnClose>
      <Form form={form} layout="vertical">
        <Form.Item name="toStageId" label="New stage" rules={[{ required: true, message: 'Select the new stage' }]}>
          <Select
            loading={stages.isLoading}
            options={(stages.data ?? [])
              .filter((s) => s.status !== 'Inactive')
              .map((s) => ({ value: s.id, label: s.name, disabled: s.id === employee.stageId }))}
          />
        </Form.Item>
        <Form.Item name="effectiveDate" label="Effective date" rules={[{ required: true, message: 'Effective date is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="reason" label="Reason" rules={[{ max: 500 }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="reviewRef" label="Review reference" tooltip="Seam for the review process (later sprint)" rules={[{ max: 100 }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/** Extends probation: a new end date + a history row carrying the reason. The stage does NOT
 * change — an extension is not a new stage (spec §9.1). */
export function ExtendProbationModal({ open, companyId, employee, onClose }: ActionModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{ newEndDate: Dayjs; reason: string }>();
  const extend = useExtendProbation(companyId, employee.id);

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
    try {
      await extend.mutateAsync({ newEndDate: toApiDate(v.newEndDate)!, reason: v.reason.trim() });
      message.success('Probation extended — the stage is unchanged');
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Probation extension failed');
    }
  };

  return (
    <Modal open={open} title="Extend probation" okText="Extend" onOk={submit} onCancel={onClose}
      confirmLoading={extend.isPending} destroyOnClose>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="An extension is not a new stage"
        description="The stage stays Probation; the extension is recorded on the stage history with your reason."
      />
      <Form form={form} layout="vertical">
        <Form.Item name="newEndDate" label="New probation end date" rules={[{ required: true, message: 'New end date is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="reason" label="Reason" rules={[{ required: true, whitespace: true, message: 'A reason is required — the extension must leave a trail' }, { max: 500 }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/** Changes the contract type mid-engagement (e.g. Casual → Permanent). Continuous service is
 * deliberately untouched — carry-vs-reset is a parked legal question (OQ-15). */
export function ContractChangeModal({ open, companyId, employee, onClose }: ActionModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{ toContractTypeId: string; validFrom: Dayjs; reason?: string }>();
  const contractTypes = useContractTypeOptions();
  const change = useChangeContractType(companyId, employee.id);

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
    try {
      await change.mutateAsync({
        toContractTypeId: v.toContractTypeId,
        validFrom: toApiDate(v.validFrom)!,
        reason: v.reason?.trim() || null,
      });
      message.success('Contract type changed');
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'CONTRACT_CHANGE_DATE_CONFLICT') {
        form.setFields([{ name: 'validFrom', errors: [err.message] }]);
        return;
      }
      message.error(isApiError(err) ? err.message : 'Contract change failed');
    }
  };

  return (
    <Modal open={open} title="Change contract type" okText="Change contract type" onOk={submit} onCancel={onClose}
      confirmLoading={change.isPending} destroyOnClose>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Continuous service date is not affected"
        description="Whether continuous service carries or resets on a contract-type change is an open legal question (OQ-15) — this action leaves it exactly as it is."
      />
      <Form form={form} layout="vertical">
        <Form.Item name="toContractTypeId" label="New contract type" rules={[{ required: true, message: 'Select the new contract type' }]}>
          <Select
            loading={contractTypes.isLoading}
            options={(contractTypes.data ?? [])
              .filter((c) => c.status !== 'Inactive')
              .map((c) => ({ value: c.id, label: c.name, disabled: c.id === employee.contractTypeId }))}
          />
        </Form.Item>
        <Form.Item name="validFrom" label="Valid from" rules={[{ required: true, message: 'Valid-from date is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="reason" label="Reason" rules={[{ max: 500 }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

interface ContractTermModalProps extends ActionModalProps {
  /** When set, the new term is a RENEWAL of this term (a new row linked by `renewalOf`). */
  renewalOf?: { id: string; termEnd?: string | null } | null;
}

/** Records a contract term on the current engagement. A renewal is a NEW row pointing at the
 * term it renews — never an overwrite (spec §5.2). */
export function ContractTermModal({ open, companyId, employee, renewalOf, onClose }: ContractTermModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{ termStart: Dayjs; termEnd?: Dayjs | null; signedDate?: Dayjs | null }>();
  const createTerm = useCreateContractTerm(companyId, employee.id);

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
    try {
      await createTerm.mutateAsync({
        termStart: toApiDate(v.termStart)!,
        termEnd: toApiDate(v.termEnd ?? null),
        signedDate: toApiDate(v.signedDate ?? null),
        renewalOf: renewalOf?.id ?? null,
      });
      message.success(renewalOf ? 'Renewal recorded as a new term' : 'Contract term recorded');
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'CONTRACT_TERM_ORDER_INVALID') {
        form.setFields([{ name: 'termEnd', errors: [err.message] }]);
        return;
      }
      message.error(isApiError(err) ? err.message : 'Could not record the contract term');
    }
  };

  return (
    <Modal open={open} title={renewalOf ? 'Renew contract term' : 'Add contract term'}
      okText={renewalOf ? 'Record renewal' : 'Add term'} onOk={submit} onCancel={onClose}
      confirmLoading={createTerm.isPending} destroyOnClose>
      {renewalOf && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="A renewal never overwrites"
          description="This records a NEW term linked to the one it renews; the original term stays on the timeline unchanged."
        />
      )}
      <Form form={form} layout="vertical">
        <Form.Item name="termStart" label="Term start" rules={[{ required: true, message: 'Term start is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item
          name="termEnd"
          label="Term end"
          tooltip="Leave blank only for a non-fixed-term arrangement"
          dependencies={['termStart']}
          rules={[
            ({ getFieldValue }) => ({
              validator: (_, value: Dayjs | null | undefined) => {
                const start = getFieldValue('termStart') as Dayjs | undefined;
                if (value && start && value.isBefore(start, 'day')) {
                  return Promise.reject(new Error('Term end must not be before term start'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="signedDate" label="Signed date">
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
