import { Alert, Card, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DataTable } from '@/components';
import type { PayGroup } from '@/types/api';
import { usePayGroups } from '../api/hooks';

/** Typical tax-treatment intent per group (Domain Reference §4) — guidance, not enforcement. */
const TREATMENT_HINT: Record<string, string> = {
  PY: 'Earning · PAYE-able · FNPF-able',
  HP: 'Earning (leave) · PAYE-able · FNPF-able',
  FP: 'Statutory FNPF deduction',
  BK: 'Bank deduction (net distribution)',
  DD: 'Post-tax deduction',
  PD: 'Pre-tax deduction',
  MP: 'Non-wage payment',
  NT: 'Allowance · not PAYE-able',
  TA: 'Taxable allowance · PAYE-able',
  FB: 'Fringe benefit',
  LP: 'Lump sum (exempt up to $5,000)',
  RP: 'Redundancy (exempt up to $15,000, balance @ 15%)',
  BN: 'Bonus · one-time for tax',
  OO: 'Other one-off payment',
};

/** Reference view of the 14 pay groups (Epic 3.1). */
export function PayGroupsReference() {
  const { data, isLoading, isError, error, refetch } = usePayGroups();

  const columns: ColumnsType<PayGroup> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 90,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    { title: 'Name', dataIndex: 'name', key: 'name', width: 220 },
    {
      title: 'Typical treatment',
      key: 'hint',
      render: (_: unknown, row) => (
        <span style={{ color: '#48566a' }}>{TREATMENT_HINT[row.code] ?? '—'}</span>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="Pay groups categorise tax treatment"
        description="The 14 groups are seeded reference data. A pay element belongs to one group; the actual PAYE/FNPF/one-time flags live on each element so rules stay data-driven (D10)."
      />
      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<PayGroup>
          rowKey="code"
          columns={columns}
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
        />
      </Card>
    </Space>
  );
}
