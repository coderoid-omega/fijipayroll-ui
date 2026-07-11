import { useEffect } from 'react';
import { App as AntApp, Form, Input } from 'antd';
import { FormDrawer } from '@/components';
import { zodRule } from '@/lib/zodForm';
import { isApiError } from '@/lib/apiError';
import type { Office, OfficeWrite } from '@/types/api';
import { officeWriteSchema, type OfficeFormValues } from '../schema';
import { useCreateOffice, useUpdateOffice } from '../api/hooks';

interface OfficeFormDrawerProps {
  open: boolean;
  companyId: string;
  editing?: Office;
  onClose: () => void;
}

/** Create/edit an office (company-scoped). */
export function OfficeFormDrawer({ open, companyId, editing, onClose }: OfficeFormDrawerProps) {
  const [form] = Form.useForm<OfficeFormValues>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(editing);

  const createMutation = useCreateOffice(companyId);
  const updateMutation = useUpdateOffice(companyId);
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
    let values: OfficeFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const parsed = officeWriteSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as OfficeWrite;
    try {
      if (isEdit && editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success('Office updated');
      } else {
        await createMutation.mutateAsync(body);
        message.success('Office created');
      }
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title={isEdit ? 'Edit office' : 'New office'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save changes' : 'Create office'}
      width={460}
    >
      <Form<OfficeFormValues> form={form} layout="vertical" requiredMark>
        <Form.Item name="code" label="Code" rules={[zodRule(officeWriteSchema.shape.code)]}>
          <Input placeholder="e.g. SUV" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="name" label="Name" rules={[zodRule(officeWriteSchema.shape.name)]}>
          <Input placeholder="e.g. Suva Head Office" />
        </Form.Item>
      </Form>
    </FormDrawer>
  );
}
