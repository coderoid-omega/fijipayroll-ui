import { useMemo, useState } from 'react';
import { Alert, Button, Card, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { DataTable, PageHeader } from '@/components';
import { useAuth } from '@/app/providers/AuthContext';
import { formatDate } from '@/lib/date';
import { formatMoney, formatPercent } from '@/lib/money';
import type { FnpfScheme } from '@/types/api';
import { useFnpfSchemes } from '../api/hooks';
import { FnpfSchemeFormDrawer } from '../components/FnpfSchemeFormDrawer';

/** FNPF schemes — Epic 4.2. Effective-dated employee/employer %, excess-exempt %; read-only. */
export function FnpfSchemePage() {
  const { data, isLoading, isError, error, refetch } = useFnpfSchemes();
  const { me } = useAuth();
  const canEdit = me?.permissions?.includes('tax-config:write') ?? false;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const schemes = useMemo(
    () => [...(data ?? [])].sort((a, b) => (a.validFrom < b.validFrom ? 1 : -1)),
    [data],
  );

  const activeScheme = useMemo(() => schemes.find((s) => s.status === 'Active'), [schemes]);

  const columns: ColumnsType<FnpfScheme> = [
    {
      title: 'Effective from',
      dataIndex: 'validFrom',
      key: 'validFrom',
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Effective to',
      dataIndex: 'validTo',
      key: 'validTo',
      render: (d: string | null) => (d ? formatDate(d) : 'Current'),
    },
    {
      title: 'Employee %',
      dataIndex: 'employeePct',
      key: 'employeePct',
      align: 'right',
      render: (v: number) => <span className="num">{formatPercent(v)}</span>,
    },
    {
      title: 'Employer %',
      dataIndex: 'employerPct',
      key: 'employerPct',
      align: 'right',
      render: (v: number) => <span className="num">{formatPercent(v)}</span>,
    },
    {
      title: 'Voluntary %',
      dataIndex: 'voluntaryPct',
      key: 'voluntaryPct',
      align: 'right',
      render: (v: number | undefined) => <span className="num">{formatPercent(v ?? 0)}</span>,
    },
    {
      title: 'Excess tax-exempt %',
      dataIndex: 'employerExcessExemptPct',
      key: 'excess',
      align: 'right',
      render: (v: number) => <span className="num">{formatPercent(v)}</span>,
    },
    {
      title: 'Wage ceiling',
      dataIndex: 'wageCeiling',
      key: 'ceiling',
      align: 'right',
      render: (v: number | null) => <span className="num">{v ? formatMoney(v) : '—'}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: FnpfScheme['status']) => (
        <Tag color={s === 'Active' ? 'green' : 'default'}>{s}</Tag>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="FNPF Scheme"
        subtitle="Fiji National Provident Fund contribution rates — effective-dated, tenant-wide."
        breadcrumbs={[{ title: 'Home', href: '/' }, { title: 'FNPF Scheme' }]}
        extra={
          canEdit ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
              New version
            </Button>
          ) : undefined
        }
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Read-only statutory configuration"
        description="Standard is employee 8% + employer 10%. Rates have changed historically (e.g. 5%+5% during COVID), so they are effective-dated; historical runs resolve to the scheme in force on their pay date. Employer FNPF above the excess-exempt threshold is taxable to the employee (FRCS SIG 2021-32)."
      />

      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<FnpfScheme>
          columns={columns}
          data={schemes}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyText="No FNPF schemes configured"
        />
      </Card>

      <FnpfSchemeFormDrawer
        open={drawerOpen}
        cloneFrom={activeScheme}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
