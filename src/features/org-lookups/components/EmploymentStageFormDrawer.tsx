import { useEffect } from 'react';
import { App as AntApp, Form, Input, InputNumber, Select, Switch } from 'antd';
import { FormDrawer } from '@/components';
import { zodRule } from '@/lib/zodForm';
import { isApiError } from '@/lib/apiError';
import type { EmploymentStage, EmploymentStageWrite } from '@/types/api';
import { employmentStageWriteSchema, type EmploymentStageFormValues } from '../schema';
import { useCreateEmploymentStage, useUpdateEmploymentStage } from '../api/hooks';

interface EmploymentStageFormDrawerProps {
  open: boolean;
  editing?: EmploymentStage;
  onClose: () => void;
}

/** Create/edit an employment stage (tenant-wide — progression within an engagement, spec §5). */
export function EmploymentStageFormDrawer({ open, editing, onClose }: EmploymentStageFormDrawerProps) {
  const [form] = Form.useForm<EmploymentStageFormValues>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(editing);

  const createMutation = useCreateEmploymentStage();
  const updateMutation = useUpdateEmploymentStage();
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        code: editing.code,
        name: editing.name,
        ordinal: editing.ordinal,
        isProbationary: editing.isProbationary,
        status: editing.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ ordinal: 0, isProbationary: false, status: 'Active' });
    }
  }, [open, editing, form]);

  const handleSubmit = async () => {
    let values: EmploymentStageFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const parsed = employmentStageWriteSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as EmploymentStageWrite;
    try {
      if (isEdit && editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success('Employment stage updated');
      } else {
        await createMutation.mutateAsync(body);
        message.success('Employment stage created');
      }
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title={isEdit ? 'Edit employment stage' : 'New employment stage'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save changes' : 'Create employment stage'}
      width={460}
    >
      <Form<EmploymentStageFormValues> form={form} layout="vertical" requiredMark>
        <Form.Item name="code" label="Code" rules={[zodRule(employmentStageWriteSchema.shape.code)]}>
          <Input placeholder="e.g. PROB" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="name" label="Name" rules={[zodRule(employmentStageWriteSchema.shape.name)]}>
          <Input placeholder="e.g. Probation" />
        </Form.Item>
        <Form.Item
          name="ordinal"
          label="Order"
          tooltip="Progression order, e.g. Trainee 1, Probation 2, Confirmed 3"
        >
          <InputNumber min={0} step={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="isProbationary"
          label="Probationary"
          valuePropName="checked"
          tooltip="Probationary stages expect probation start/end dates on the employee"
        >
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
