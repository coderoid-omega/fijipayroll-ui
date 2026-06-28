import { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Select, Space, Spin, Tabs, Tag } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader, QueryError } from '@/components';
import { formatDate } from '@/lib/date';
import { useAuth } from '@/app/providers/AuthContext';
import type { Levy, TaxBracket, TaxRuleSet, TaxType } from '@/types/api';
import { useTaxRuleSets } from '../api/hooks';
import { BracketsTable } from '../components/BracketsTable';
import { TaxRuleSetFormDrawer } from '../components/TaxRuleSetFormDrawer';

function statusColor(status: TaxRuleSet['status']): string {
  return status === 'Active' ? 'green' : status === 'Draft' ? 'gold' : 'default';
}

function slice(brackets: TaxBracket[], levy: Levy, taxType: TaxType): TaxBracket[] {
  return brackets.filter((b) => b.levy === levy && b.taxType === taxType);
}

/** Tax rule sets — Epic 4.1. Effective-dated PAYE/SRT/ECAL bands; read-only (tenant-wide). */
export function TaxConfigPage() {
  const { data, isLoading, isError, error, refetch } = useTaxRuleSets();
  const { me } = useAuth();
  const canEdit = me?.permissions?.includes('tax-config:write') ?? false;
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [drawer, setDrawer] = useState<{ mode: 'new' | 'edit' } | null>(null);

  const ruleSets = useMemo(
    () =>
      [...(data ?? [])].sort((a, b) => (a.validFrom < b.validFrom ? 1 : -1)),
    [data],
  );

  const selected = useMemo(() => {
    if (ruleSets.length === 0) return undefined;
    return ruleSets.find((r) => r.id === selectedId) ?? ruleSets.find((r) => r.status === 'Active') ?? ruleSets[0];
  }, [ruleSets, selectedId]);

  const tabs = useMemo(() => {
    if (!selected) return [];
    const defs: { key: string; label: string; levy: Levy; taxType: TaxType }[] = [
      { key: 'paye-res', label: 'PAYE — Resident', levy: 'PAYE', taxType: 'Resident' },
      { key: 'paye-nonres', label: 'PAYE — Non-Resident', levy: 'PAYE', taxType: 'NonResident' },
      { key: 'srt', label: 'SRT', levy: 'SRT', taxType: 'Resident' },
      { key: 'ecal', label: 'ECAL', levy: 'ECAL', taxType: 'Resident' },
    ];
    return defs
      .map((d) => ({ ...d, rows: slice(selected.brackets, d.levy, d.taxType) }))
      .filter((d) => d.rows.length > 0)
      .map((d) => ({ key: d.key, label: d.label, children: <BracketsTable brackets={d.rows} /> }));
  }, [selected]);

  return (
    <>
      <PageHeader
        title="Tax Configuration"
        subtitle="PAYE, SRT & ECAL bands — effective-dated, tenant-wide (national statutory rules)."
        breadcrumbs={[{ title: 'Home', href: '/' }, { title: 'Tax Configuration' }]}
        extra={
          ruleSets.length > 0 ? (
            <Space wrap>
              <Select
                value={selected?.id}
                style={{ minWidth: 260 }}
                onChange={setSelectedId}
                options={ruleSets.map((r) => ({
                  value: r.id,
                  label: `${r.code} · from ${formatDate(r.validFrom)}`,
                }))}
              />
              {canEdit && selected?.status === 'Draft' && (
                <Button icon={<EditOutlined />} onClick={() => setDrawer({ mode: 'edit' })}>
                  Edit draft
                </Button>
              )}
              {canEdit && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawer({ mode: 'new' })}>
                  New version
                </Button>
              )}
            </Space>
          ) : undefined
        }
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Effective-dated statutory configuration"
        description={
          canEdit
            ? 'These national rules are effective-dated and versioned. Creating a new version supersedes the current one from its effective date; historical runs always re-resolve to the rule set that applied on their pay date, so past results never change.'
            : 'These national rules are effective-dated and versioned; historical runs always re-resolve to the rule set that applied on their pay date. Editing requires the tax-config:write permission.'
        }
      />

      {isLoading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 200 }}>
          <Spin />
        </div>
      ) : isError ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : selected ? (
        <Card>
          <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Rule set">{selected.code}</Descriptions.Item>
            <Descriptions.Item label="Effective from">
              {formatDate(selected.validFrom)}
            </Descriptions.Item>
            <Descriptions.Item label="Effective to">
              {selected.validTo ? formatDate(selected.validTo) : 'Current'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColor(selected.status)}>{selected.status}</Tag>
            </Descriptions.Item>
            {selected.description && (
              <Descriptions.Item label="Notes" span={2}>
                {selected.description}
              </Descriptions.Item>
            )}
          </Descriptions>
          <Tabs items={tabs} />
        </Card>
      ) : (
        <Space>No tax rule sets configured.</Space>
      )}

      <TaxRuleSetFormDrawer
        open={drawer !== null}
        editing={drawer?.mode === 'edit' ? selected : undefined}
        cloneFrom={drawer?.mode === 'new' ? selected : undefined}
        onClose={() => setDrawer(null)}
      />
    </>
  );
}
