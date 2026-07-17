import { useEffect, useState } from 'react';
import { Alert, App as AntApp, DatePicker, Form, Input, InputNumber, Modal, Select, Switch, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import { isApiError } from '@/lib/apiError';
import { toApiDate, DISPLAY_DATE_FORMAT } from '@/lib/date';
import type { Employee, NoticeHandling } from '@/types/api';
import {
  useContractTypeOptions,
  useEmploymentStageOptions,
  useExitReasonOptions,
  useLiftSuspension,
  useRehireEmployee,
  useSuspendEmployee,
  useTerminateEmployee,
} from '../api/hooks';

// Sprint 2 Epic 5 — the status machine's four actions. TENANT-ONLY ([S06-dissolved OQ-32]):
// terminate disables no login — no employee has credentials; the credentials epic owns that.
// The terminate form is D10 config driving a form: the EXIT REASON'S FLAGS decide what renders
// (severance surfaces on REDUND, the notice block hides when notice isn't required, PaidInLieu
// visibly splits last working day from the effective date) — which is exactly where a wrong flag
// reading looks like correct behaviour, so this file ships with component tests.

export type StatusAction = 'suspend' | 'lift-suspension' | 'terminate' | 'rehire';

interface StatusModalProps {
  open: boolean;
  companyId: string;
  employee: Employee;
  onClose: () => void;
}

/** Opens a suspension window (Active → Suspended). Overlaps are impossible at the database. */
export function SuspendModal({ open, companyId, employee, onClose }: StatusModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{ isPaid: boolean; startDate: Dayjs; endDate?: Dayjs | null; reason: string }>();
  const suspend = useSuspendEmployee(companyId, employee.id);

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
      await suspend.mutateAsync({
        isPaid: v.isPaid ?? false,
        startDate: toApiDate(v.startDate)!,
        endDate: toApiDate(v.endDate ?? null),
        reason: v.reason.trim(),
      });
      message.success('Employee suspended');
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'SUSPENSION_OVERLAP') {
        form.setFields([{ name: 'startDate', errors: [err.message] }]);
        return;
      }
      message.error(isApiError(err) ? err.message : 'Suspend failed');
    }
  };

  return (
    <Modal open={open} title="Suspend employee" okText="Suspend" onOk={submit} onCancel={onClose}
      confirmLoading={suspend.isPending} destroyOnClose>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 12 }}
        message="Unpaid suspension is payroll-affecting"
        description="The window is recorded on the suspension history; the payroll engine reads it from Sprint 3."
      />
      <Form form={form} layout="vertical" initialValues={{ isPaid: false }}>
        <Form.Item name="isPaid" label="Paid suspension" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="startDate" label="Start date" rules={[{ required: true, message: 'Start date is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item
          name="endDate"
          label="End date"
          tooltip="Leave blank for an open-ended window"
          dependencies={['startDate']}
          rules={[
            ({ getFieldValue }) => ({
              validator: (_, value: Dayjs | null | undefined) => {
                const start = getFieldValue('startDate') as Dayjs | undefined;
                return value && start && value.isBefore(start, 'day')
                  ? Promise.reject(new Error('End date must not be before the start date'))
                  : Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="reason" label="Reason" rules={[{ required: true, whitespace: true, message: 'A reason is required' }, { max: 500 }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/** Closes the open suspension window (Suspended → Active). */
export function LiftSuspensionModal({ open, companyId, employee, onClose }: StatusModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{ endDate?: Dayjs | null; reason?: string }>();
  const lift = useLiftSuspension(companyId, employee.id);

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
      await lift.mutateAsync({
        endDate: toApiDate(v.endDate ?? null),
        reason: v.reason?.trim() || null,
      });
      message.success('Suspension lifted');
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'SUSPENSION_END_BEFORE_START') {
        form.setFields([{ name: 'endDate', errors: [err.message] }]);
        return;
      }
      message.error(isApiError(err) ? err.message : 'Lift suspension failed');
    }
  };

  return (
    <Modal open={open} title="Lift suspension" okText="Lift suspension" onOk={submit} onCancel={onClose}
      confirmLoading={lift.isPending} destroyOnClose>
      <Form form={form} layout="vertical">
        <Form.Item name="endDate" label="End date" tooltip="Defaults to today; closes the open window">
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="reason" label="Reason" rules={[{ max: 500 }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

const NOTICE_HANDLINGS: { value: NoticeHandling; label: string }[] = [
  { value: 'Served', label: 'Served' },
  { value: 'PaidInLieu', label: 'Paid in lieu' },
  { value: 'Waived', label: 'Waived' },
  { value: 'NotRequired', label: 'Not required' },
];

/**
 * Terminate (Active|Suspended → Terminated). THE flag-driven form: pick an exit reason and its
 * D10 flags decide what renders — severance eligibility surfaces (REDUND), the notice block
 * hides entirely when the reason requires no notice (SUMDIS/RETIRE/…), and PaidInLieu calls out
 * that the last working day and the effective date genuinely diverge. Records fields only —
 * severance/notice AMOUNTS are the deferred separation workflow.
 */
export function TerminateModal({ open, companyId, employee, onClose }: StatusModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{
    exitReasonId: string;
    noticeDate?: Dayjs | null;
    noticePeriodDays?: number | null;
    lastWorkingDay: Dayjs;
    terminationEffectiveDate: Dayjs;
    noticeHandling: NoticeHandling;
  }>();
  const exitReasons = useExitReasonOptions();
  const terminate = useTerminateEmployee(companyId, employee.id);
  const exitReasonId = Form.useWatch('exitReasonId', form);
  const noticeHandling = Form.useWatch('noticeHandling', form);
  const reason = exitReasons.data?.find((r) => r.id === exitReasonId);

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
      await terminate.mutateAsync({
        exitReasonId: v.exitReasonId,
        noticeDate: toApiDate(v.noticeDate ?? null),
        noticePeriodDays: v.noticePeriodDays ?? null,
        lastWorkingDay: toApiDate(v.lastWorkingDay)!,
        terminationEffectiveDate: toApiDate(v.terminationEffectiveDate)!,
        noticeHandling: v.noticeHandling,
      });
      message.success('Employee terminated — the engagement records the exit');
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Terminate failed');
    }
  };

  return (
    <Modal open={open} title="Terminate employee" okText="Terminate" okButtonProps={{ danger: true }}
      onOk={submit} onCancel={onClose} confirmLoading={terminate.isPending} destroyOnClose>
      <Form form={form} layout="vertical" initialValues={{ noticeHandling: 'Served' }}>
        <Form.Item name="exitReasonId" label="Exit reason" rules={[{ required: true, message: 'Exit reason is required' }]}>
          <Select
            loading={exitReasons.isLoading}
            placeholder="Select the exit reason"
            options={(exitReasons.data ?? [])
              .filter((r) => r.status !== 'Inactive')
              .map((r) => ({ value: r.id, label: r.name }))}
          />
        </Form.Item>

        {/* The flags ARE the behaviour (D10) — surfaced, never computed here. */}
        {reason && (
          <div style={{ marginBottom: 12 }} data-testid="exit-reason-flags">
            <Tag>{reason.initiator} initiated</Tag>
            {reason.severanceEligible && <Tag color="gold">Severance eligible</Tag>}
            {!reason.rehireEligible && <Tag color="red">Not rehire-eligible</Tag>}
          </div>
        )}
        {reason?.severanceEligible && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="This exit reason is severance-eligible"
            description="Severance is calculated by the separation workflow (a later slice) — this action only records the exit."
          />
        )}

        {/* The notice block exists only when the reason requires notice. */}
        {(reason?.noticeRequired ?? true) && (
          <div data-testid="notice-block">
            <Form.Item name="noticeDate" label="Notice date">
              <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
            </Form.Item>
            <Form.Item name="noticePeriodDays" label="Notice period (days)">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="noticeHandling" label="Notice handling" rules={[{ required: true }]}>
              <Select options={NOTICE_HANDLINGS} />
            </Form.Item>
          </div>
        )}

        {noticeHandling === 'PaidInLieu' && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="Paid in lieu: the two dates differ"
            description="The last working day is when the employee actually leaves; the termination effective date is when employment legally ends, after the paid notice period. Both are recorded."
          />
        )}

        <Form.Item name="lastWorkingDay" label="Last working day" rules={[{ required: true, message: 'Last working day is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="terminationEffectiveDate" label="Termination effective date" rules={[{ required: true, message: 'Effective date is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/**
 * Rehire (Terminated → Active): opens a NEW engagement; the server resyncs the whole employee
 * cache. When the prior exit reason blocks rehire (409 REHIRE_NOT_ELIGIBLE), the override path
 * surfaces — an explicit switch plus a MANDATORY reason, which the audit records ([S06]).
 */
export function RehireModal({ open, companyId, employee, onClose }: StatusModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{
    dateOfHire: Dayjs;
    contractTypeId: string;
    stageId?: string | null;
    continuousServiceDate?: Dayjs | null;
    overrideReason?: string;
  }>();
  const contractTypes = useContractTypeOptions();
  const stages = useEmploymentStageOptions();
  const rehire = useRehireEmployee(companyId, employee.id);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setBlocked(null);
  }, [open, form]);

  const submit = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    try {
      await rehire.mutateAsync({
        dateOfHire: toApiDate(v.dateOfHire)!,
        contractTypeId: v.contractTypeId,
        stageId: v.stageId ?? null,
        continuousServiceDate: toApiDate(v.continuousServiceDate ?? null),
        overrideRehireBlock: blocked !== null ? true : undefined,
        overrideReason: blocked !== null ? v.overrideReason?.trim() : undefined,
      });
      message.success('Employee rehired on a new engagement');
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'REHIRE_NOT_ELIGIBLE') {
        // The block is deliberate and traceable, not a dead end: surface the override path.
        setBlocked(err.message);
        return;
      }
      message.error(isApiError(err) ? err.message : 'Rehire failed');
    }
  };

  return (
    <Modal open={open} title="Rehire employee" okText={blocked ? 'Override and rehire' : 'Rehire'}
      onOk={submit} onCancel={onClose} confirmLoading={rehire.isPending} destroyOnClose>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Rehire opens a new engagement"
        description="The prior engagement's history stays intact. Service, probation and stage start fresh; the employee keeps the same employee code."
      />
      {blocked && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          data-testid="rehire-blocked"
          message="The prior exit reason blocks rehire"
          description={blocked}
        />
      )}
      <Form form={form} layout="vertical">
        <Form.Item name="dateOfHire" label="New hire date" rules={[{ required: true, message: 'Hire date is required' }]}>
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        <Form.Item name="contractTypeId" label="Contract type" rules={[{ required: true, message: 'Contract type is required' }]}>
          <Select
            loading={contractTypes.isLoading}
            options={(contractTypes.data ?? [])
              .filter((c) => c.status !== 'Inactive')
              .map((c) => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="stageId" label="Stage">
          <Select
            allowClear
            loading={stages.isLoading}
            options={(stages.data ?? [])
              .filter((s) => s.status !== 'Inactive')
              .map((s) => ({ value: s.id, label: s.name }))}
          />
        </Form.Item>
        <Form.Item
          name="continuousServiceDate"
          label="Continuous service date"
          tooltip="Defaults to the new hire date. Carry-over from the prior engagement is never assumed."
        >
          <DatePicker style={{ width: '100%' }} format={DISPLAY_DATE_FORMAT} />
        </Form.Item>
        {blocked && (
          <Form.Item
            name="overrideReason"
            label="Override reason"
            tooltip="Recorded in the audit trail with the override"
            rules={[{ required: true, whitespace: true, message: 'An override reason is required — the audit records it' }, { max: 500 }]}
          >
            <Input.TextArea rows={2} data-testid="override-reason" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
