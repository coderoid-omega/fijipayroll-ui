import { useEffect } from 'react';
import { App as AntApp, Form, Input } from 'antd';
import { FormDrawer } from '@/components';
import { zodRule } from '@/lib/zodForm';
import { isApiError } from '@/lib/apiError';
import type { Lookup, LookupWrite } from '@/types/api';
import { tenantConfigLookupWriteSchema, type TenantConfigLookupFormValues } from '../schema';
import { useCreateTenantConfigLookup, useUpdateTenantConfigLookup } from '../api/hooks';
import type { TenantConfigLookupResource } from '../api/orgApi';

interface TenantConfigLookupFormDrawerProps {
  open: boolean;
  resource: TenantConfigLookupResource;
  /** Singular label, e.g. "work-permit type". */
  entityLabel: string;
  editing?: Lookup;
  onClose: () => void;
}

/** Create/edit a simple tenant-wide employee-config lookup (work-permit / relationship /
 * document types — Sprint 2 Epic 1, all tenant-wide per OQ-24). */
export function TenantConfigLookupFormDrawer({
  open,
  resource,
  entityLabel,
  editing,
  onClose,
}: TenantConfigLookupFormDrawerProps) {
  const [form] = Form.useForm<TenantConfigLookupFormValues>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(editing);

  const createMutation = useCreateTenantConfigLookup(resource);
  const updateMutation = useUpdateTenantConfigLookup(resource);
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
    let values: TenantConfigLookupFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const parsed = tenantConfigLookupWriteSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as LookupWrite;
    try {
      if (isEdit && editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success(`${capitalise(entityLabel)} updated`);
      } else {
        await createMutation.mutateAsync(body);
        message.success(`${capitalise(entityLabel)} created`);
      }
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title={isEdit ? `Edit ${entityLabel}` : `New ${entityLabel}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save changes' : `Create ${entityLabel}`}
      width={460}
    >
      <Form<TenantConfigLookupFormValues> form={form} layout="vertical" requiredMark>
        <Form.Item
          name="code"
          label="Code"
          rules={[zodRule(tenantConfigLookupWriteSchema.shape.code)]}
        >
          <Input placeholder="e.g. LT" disabled={isEdit} />
        </Form.Item>
        <Form.Item
          name="name"
          label="Name"
          rules={[zodRule(tenantConfigLookupWriteSchema.shape.name)]}
        >
          <Input placeholder="e.g. Long-term (3yr)" />
        </Form.Item>
      </Form>
    </FormDrawer>
  );
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
