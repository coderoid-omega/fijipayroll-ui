import { useEffect } from 'react';
import { App as AntApp, Form, Input, Select, Switch } from 'antd';
import { FormDrawer } from '@/components';
import { zodRule } from '@/lib/zodForm';
import { isApiError } from '@/lib/apiError';
import type { ContractType, ContractTypeWrite } from '@/types/api';
import { contractTypeWriteSchema, type ContractTypeFormValues } from '../schema';
import { useCreateContractType, useUpdateContractType } from '../api/hooks';

interface ContractTypeFormDrawerProps {
  open: boolean;
  editing?: ContractType;
  onClose: () => void;
}

/** Create/edit a contract type (tenant-wide — the legal basis of engagement, spec §5). */
export function ContractTypeFormDrawer({ open, editing, onClose }: ContractTypeFormDrawerProps) {
  const [form] = Form.useForm<ContractTypeFormValues>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(editing);

  const createMutation = useCreateContractType();
  const updateMutation = useUpdateContractType();
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        code: editing.code,
        name: editing.name,
        isFixedTerm: editing.isFixedTerm,
        status: editing.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ isFixedTerm: false, status: 'Active' });
    }
  }, [open, editing, form]);

  const handleSubmit = async () => {
    let values: ContractTypeFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const parsed = contractTypeWriteSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as ContractTypeWrite;
    try {
      if (isEdit && editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success('Contract type updated');
      } else {
        await createMutation.mutateAsync(body);
        message.success('Contract type created');
      }
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title={isEdit ? 'Edit contract type' : 'New contract type'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save changes' : 'Create contract type'}
      width={460}
    >
      <Form<ContractTypeFormValues> form={form} layout="vertical" requiredMark>
        <Form.Item name="code" label="Code" rules={[zodRule(contractTypeWriteSchema.shape.code)]}>
          <Input placeholder="e.g. PERM" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="name" label="Name" rules={[zodRule(contractTypeWriteSchema.shape.name)]}>
          <Input placeholder="e.g. Permanent" />
        </Form.Item>
        <Form.Item
          name="isFixedTerm"
          label="Fixed-term"
          valuePropName="checked"
          tooltip="Fixed-term contracts require contract terms with an end date"
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
