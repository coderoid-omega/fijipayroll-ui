import { useEffect } from 'react';
import { App as AntApp, Form, Input, Select, Switch } from 'antd';
import { FormDrawer } from '@/components';
import { zodRule } from '@/lib/zodForm';
import { isApiError } from '@/lib/apiError';
import type { ExitReason, ExitReasonWrite } from '@/types/api';
import { exitReasonWriteSchema, type ExitReasonFormValues } from '../schema';
import { useCreateExitReason, useUpdateExitReason } from '../api/hooks';

interface ExitReasonFormDrawerProps {
  open: boolean;
  editing?: ExitReason;
  onClose: () => void;
}

/** Create/edit an exit reason (tenant-wide). Rules are data (D10): the flags set here — not code
 * branches — decide whether severance is due and whether notice is required (Domain §2.3). */
export function ExitReasonFormDrawer({ open, editing, onClose }: ExitReasonFormDrawerProps) {
  const [form] = Form.useForm<ExitReasonFormValues>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(editing);

  const createMutation = useCreateExitReason();
  const updateMutation = useUpdateExitReason();
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        code: editing.code,
        name: editing.name,
        initiator: editing.initiator,
        severanceEligible: editing.severanceEligible,
        noticeRequired: editing.noticeRequired,
        rehireEligible: editing.rehireEligible,
        status: editing.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        severanceEligible: false,
        noticeRequired: true,
        rehireEligible: true,
        status: 'Active',
      });
    }
  }, [open, editing, form]);

  const handleSubmit = async () => {
    let values: ExitReasonFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const parsed = exitReasonWriteSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as ExitReasonWrite;
    try {
      if (isEdit && editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success('Exit reason updated');
      } else {
        await createMutation.mutateAsync(body);
        message.success('Exit reason created');
      }
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title={isEdit ? 'Edit exit reason' : 'New exit reason'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save changes' : 'Create exit reason'}
      width={460}
    >
      <Form<ExitReasonFormValues> form={form} layout="vertical" requiredMark>
        <Form.Item name="code" label="Code" rules={[zodRule(exitReasonWriteSchema.shape.code)]}>
          <Input placeholder="e.g. REDUND" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="name" label="Name" rules={[zodRule(exitReasonWriteSchema.shape.name)]}>
          <Input placeholder="e.g. Redundancy" />
        </Form.Item>
        <Form.Item
          name="initiator"
          label="Initiated by"
          rules={[{ required: true, message: 'Select who initiates this exit' }]}
          tooltip="'Neither' covers fixed-term expiry, retirement and death"
        >
          <Select
            placeholder="Select initiator"
            options={[
              { value: 'Employee', label: 'Employee' },
              { value: 'Employer', label: 'Employer' },
              { value: 'Neither', label: 'Neither (expiry / retirement / death)' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="severanceEligible"
          label="Severance eligible"
          valuePropName="checked"
          tooltip="ERA 2007: due on redundancy, NOT on misconduct, resignation, fixed-term expiry or retirement"
        >
          <Switch />
        </Form.Item>
        <Form.Item name="noticeRequired" label="Notice required" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="rehireEligible" label="Rehire eligible" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="status" label="Status">
          <Select
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
        </Form.Item>
      </Form>
    </FormDrawer>
  );
}
