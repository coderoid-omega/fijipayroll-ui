import { useEffect } from 'react';
import { App as AntApp, Form, Input } from 'antd';
import { FormDrawer } from '@/components';
import { zodRule } from '@/lib/zodForm';
import { isApiError } from '@/lib/apiError';
import type { Lookup, LookupWrite } from '@/types/api';
import { occupationWriteSchema, type OccupationFormValues } from '../schema';
import { useCreateOccupation, useUpdateOccupation } from '../api/hooks';

interface OccupationFormDrawerProps {
  open: boolean;
  editing?: Lookup;
  onClose: () => void;
}

/** Create/edit an occupation (tenant-wide reference — no company scope). */
export function OccupationFormDrawer({ open, editing, onClose }: OccupationFormDrawerProps) {
  const [form] = Form.useForm<OccupationFormValues>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(editing);

  const createMutation = useCreateOccupation();
  const updateMutation = useUpdateOccupation();
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({ code: editing.code, name: editing.name });
    } else {
      form.resetFields();
    }
  }, [open, editing, form]);

  const handleSubmit = async () => {
    let values: OccupationFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const parsed = occupationWriteSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as LookupWrite;
    try {
      if (isEdit && editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success('Occupation updated');
      } else {
        await createMutation.mutateAsync(body);
        message.success('Occupation created');
      }
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title={isEdit ? 'Edit occupation' : 'New occupation'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save changes' : 'Create occupation'}
      width={460}
    >
      <Form<OccupationFormValues> form={form} layout="vertical" requiredMark>
        <Form.Item name="code" label="Code" rules={[zodRule(occupationWriteSchema.shape.code)]}>
          <Input placeholder="e.g. ENG" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="name" label="Name" rules={[zodRule(occupationWriteSchema.shape.name)]}>
          <Input placeholder="e.g. Engineer" />
        </Form.Item>
      </Form>
    </FormDrawer>
  );
}
