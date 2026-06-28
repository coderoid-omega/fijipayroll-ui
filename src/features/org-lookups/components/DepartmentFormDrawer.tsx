import { useEffect } from 'react';
import { App as AntApp, Form, Input, Select } from 'antd';
import { FormDrawer } from '@/components';
import { zodRule } from '@/lib/zodForm';
import { isApiError } from '@/lib/apiError';
import type { Department, DepartmentWrite } from '@/types/api';
import { departmentWriteSchema, type DepartmentFormValues } from '../schema';
import { useCreateDepartment, useUpdateDepartment } from '../api/hooks';

interface DepartmentFormDrawerProps {
  open: boolean;
  companyId: string;
  /** All departments (for the parent picker); excludes self when editing. */
  departments: Department[];
  editing?: Department;
  onClose: () => void;
}

/** Create/edit a department — Epic 5.2. */
export function DepartmentFormDrawer({
  open,
  companyId,
  departments,
  editing,
  onClose,
}: DepartmentFormDrawerProps) {
  const [form] = Form.useForm<DepartmentFormValues>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(editing);

  const createMutation = useCreateDepartment(companyId);
  const updateMutation = useUpdateDepartment(companyId);
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        code: editing.code,
        name: editing.name,
        parentDepartmentId: editing.parentDepartmentId ?? undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, editing, form]);

  const parentOptions = departments
    .filter((d) => d.id !== editing?.id)
    .map((d) => ({ value: d.id, label: `${d.code} — ${d.name}` }));

  const handleSubmit = async () => {
    let values: DepartmentFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const parsed = departmentWriteSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as DepartmentWrite;
    try {
      if (isEdit && editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success('Department updated');
      } else {
        await createMutation.mutateAsync(body);
        message.success('Department created');
      }
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title={isEdit ? 'Edit department' : 'New department'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save changes' : 'Create department'}
      width={460}
    >
      <Form<DepartmentFormValues> form={form} layout="vertical" requiredMark>
        <Form.Item name="code" label="Code" rules={[zodRule(departmentWriteSchema.shape.code)]}>
          <Input placeholder="e.g. FIN" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="name" label="Name" rules={[zodRule(departmentWriteSchema.shape.name)]}>
          <Input placeholder="e.g. Finance" />
        </Form.Item>
        <Form.Item name="parentDepartmentId" label="Parent department">
          <Select allowClear placeholder="None (top-level)" options={parentOptions} />
        </Form.Item>
      </Form>
    </FormDrawer>
  );
}
