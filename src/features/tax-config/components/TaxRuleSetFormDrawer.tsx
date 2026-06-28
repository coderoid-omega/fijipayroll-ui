import { useEffect, useState } from 'react';
import { Alert, App as AntApp, Form, Input, Tabs } from 'antd';
import type { Dayjs } from 'dayjs';
import { EffectiveDateField, FormDrawer } from '@/components';
import { toApiDate } from '@/lib/date';
import { isApiError } from '@/lib/apiError';
import type { Levy, TaxBracket, TaxRuleSet, TaxRuleSetWrite, TaxType } from '@/types/api';
import { taxRuleSetWriteSchema } from '../schema';
import { useCreateTaxRuleSet, useUpdateTaxRuleSet } from '../api/hooks';
import { EditableBracketsTable, type EditRow } from './EditableBracketsTable';

interface TaxRuleSetFormDrawerProps {
  open: boolean;
  /** Edit a Draft set; omit to create a new version (cloned from `cloneFrom` if given). */
  editing?: TaxRuleSet;
  cloneFrom?: TaxRuleSet;
  onClose: () => void;
}

interface SliceDef {
  key: string;
  label: string;
  levy: Levy;
  taxType: TaxType;
}

const SLICES: SliceDef[] = [
  { key: 'paye-res', label: 'PAYE — Resident', levy: 'PAYE', taxType: 'Resident' },
  { key: 'paye-nonres', label: 'PAYE — Non-Resident', levy: 'PAYE', taxType: 'NonResident' },
  { key: 'srt', label: 'SRT', levy: 'SRT', taxType: 'Resident' },
  { key: 'ecal', label: 'ECAL', levy: 'ECAL', taxType: 'Resident' },
];

type SliceRows = Record<string, EditRow[]>;

function bracketsToRows(brackets: TaxBracket[], levy: Levy, taxType: TaxType): EditRow[] {
  return brackets
    .filter((b) => b.levy === levy && b.taxType === taxType)
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((b, i) => ({
      key: `seed-${levy}-${taxType}-${i}`,
      lowerBound: b.lowerBound,
      upperBound: b.upperBound ?? null,
      baseAmount: b.baseAmount,
      ratePct: Math.round(b.marginalRate * 10000) / 100,
    }));
}

function buildSliceRows(source?: TaxRuleSet): SliceRows {
  const result: SliceRows = {};
  for (const s of SLICES) {
    result[s.key] = source ? bracketsToRows(source.brackets, s.levy, s.taxType) : [];
  }
  return result;
}

interface HeaderForm {
  code: string;
  description?: string;
  validFrom?: Dayjs;
}

/** Create a new tax rule set version (or edit a Draft) with an editable brackets grid — Epic 4.1. */
export function TaxRuleSetFormDrawer({ open, editing, cloneFrom, onClose }: TaxRuleSetFormDrawerProps) {
  const [form] = Form.useForm<HeaderForm>();
  const { message } = AntApp.useApp();
  const isEdit = Boolean(editing);
  const [slices, setSlices] = useState<SliceRows>({});

  const createMutation = useCreateTaxRuleSet();
  const updateMutation = useUpdateTaxRuleSet();
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    const source = editing ?? cloneFrom;
    setSlices(buildSliceRows(source));
    form.resetFields();
    if (editing) {
      form.setFieldsValue({ code: editing.code, description: editing.description ?? undefined });
    } else if (cloneFrom) {
      // Suggest a fresh code; user adjusts. Date intentionally blank for the new version.
      form.setFieldsValue({ description: cloneFrom.description ?? undefined });
    }
  }, [open, editing, cloneFrom, form]);

  const setSliceRows = (key: string, rows: EditRow[]) =>
    setSlices((prev) => ({ ...prev, [key]: rows }));

  const handleSubmit = async () => {
    let header: HeaderForm;
    try {
      header = await form.validateFields();
    } catch {
      return;
    }
    const brackets = SLICES.flatMap((s) =>
      (slices[s.key] ?? []).map((r, i) => ({
        taxType: s.taxType,
        levy: s.levy,
        lowerBound: r.lowerBound,
        upperBound: r.upperBound,
        baseAmount: r.baseAmount,
        marginalRate: Math.round((r.ratePct / 100) * 10000) / 10000,
        ordinal: i + 1,
      })),
    );

    const parsed = taxRuleSetWriteSchema.safeParse({
      code: header.code,
      description: header.description ?? null,
      validFrom: toApiDate(header.validFrom ?? null) ?? '',
      status: 'Active',
      brackets,
    });
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please fix the highlighted fields');
      return;
    }
    const body = parsed.data as TaxRuleSetWrite;
    try {
      if (isEdit && editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        message.success('Tax rule set updated');
      } else {
        await createMutation.mutateAsync(body);
        message.success('New tax rule set version created');
      }
      onClose();
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Save failed');
    }
  };

  return (
    <FormDrawer
      open={open}
      title={isEdit ? 'Edit tax rule set' : 'New tax rule set version'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={isEdit ? 'Save changes' : 'Create version'}
      width={760}
    >
      {!isEdit && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Creating a new version supersedes the current active rule set from its effective date. History stays immutable so past runs are unaffected."
        />
      )}
      <Form<HeaderForm> form={form} layout="vertical" requiredMark>
        <Form.Item
          name="code"
          label="Rule set code"
          rules={[{ required: true, message: 'Code is required' }]}
        >
          <Input placeholder="e.g. FJ-STAT-2027.1" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input placeholder="e.g. Fiji statutory PAYE/SRT/ECAL — 2027 tax year" />
        </Form.Item>
        <EffectiveDateField showVersioningNote={false} />
      </Form>

      <Tabs
        items={SLICES.map((s) => ({
          key: s.key,
          label: s.label,
          children: (
            <EditableBracketsTable
              rows={slices[s.key] ?? []}
              onChange={(rows) => setSliceRows(s.key, rows)}
            />
          ),
        }))}
      />
    </FormDrawer>
  );
}
