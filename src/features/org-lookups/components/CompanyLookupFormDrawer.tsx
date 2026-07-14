import { useEffect } from 'react';
import { App as AntApp, Form, Input } from 'antd';
import { FormDrawer } from '@/components';
import { zodRule } from '@/lib/zodForm';
import { isApiError } from '@/lib/apiError';
import type { CompanyLookup, CompanyLookupWrite } from '@/types/api';
import { companyLookupWriteSchema, type CompanyLookupFormValues } from '../schema';
import { useCreateCompanyLookup, useUpdateCompanyLookup } from '../api/hooks';
import type { CompanyLookupResource } from '../api/orgApi';

interface CompanyLookupFormDrawerProps {
  open: boolean;
  resource: CompanyLookupResource;
  /** Singular label used in titles/messages, e.g. "division". */
  entityLabel: string;
  companyId: string;
  editing?: CompanyLookup;
  onClose: () => void;
}

/**
 * Create/edit one of the company-scoped org-structure masters (division/section/grade/level).
 * All four share this drawer: name required, code optional (blank is stored as no code).
 */
export function CompanyLookupFormDrawer({
  open,
  resource,
  entityLabel,
  companyId,
  editing,
  onClose,
}: CompanyLookupFormDrawerProps) {
  const [form] = Form.useForm<CompanyLookupFormValues>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(editing);

  const createMutation = useCreateCompanyLookup(resource, companyId);
  const updateMutation = useUpdateCompanyLookup(resource, companyId);
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({ code: editing.code ?? '', name: editing.name });
    } else {
      form.resetFields();
    }
  }, [open, editing, form]);

  const handleSubmit = async () => {
    let values: CompanyLookupFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const parsed = companyLookupWriteSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    // Blank code means "no code" — send null so the API stores it as absent.
    const body: CompanyLookupWrite = {
      code: parsed.data.code ? parsed.data.code : null,
      name: parsed.data.name,
    };
    try {
      if (isEdit && editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success(`${capitalize(entityLabel)} updated`);
      } else {
        await createMutation.mutateAsync(body);
        message.success(`${capitalize(entityLabel)} created`);
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
      <Form<CompanyLookupFormValues> form={form} layout="vertical" requiredMark>
        <Form.Item name="name" label="Name" rules={[zodRule(companyLookupWriteSchema.shape.name)]}>
          <Input placeholder={`e.g. ${NAME_PLACEHOLDERS[resource]}`} />
        </Form.Item>
        <Form.Item
          name="code"
          label="Code (optional)"
          rules={[zodRule(companyLookupWriteSchema.shape.code)]}
        >
          <Input placeholder={`e.g. ${CODE_PLACEHOLDERS[resource]}`} />
        </Form.Item>
      </Form>
    </FormDrawer>
  );
}

const NAME_PLACEHOLDERS: Record<CompanyLookupResource, string> = {
  divisions: 'Western Division',
  sections: 'Packing',
  grades: 'Grade 5',
  levels: 'Senior',
};

const CODE_PLACEHOLDERS: Record<CompanyLookupResource, string> = {
  divisions: 'WD',
  sections: 'PCK',
  grades: 'G5',
  levels: 'SNR',
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
