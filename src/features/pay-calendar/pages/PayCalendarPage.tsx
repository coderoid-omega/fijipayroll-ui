import { useMemo, useState } from 'react';
import { Alert, Card, Col, Row, Select, Space, Statistic, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DataTable, PageHeader } from '@/components';
import { useTenantCompany } from '@/app/providers/TenantCompanyContext';
import { formatDate } from '@/lib/date';
import { humanize } from '@/lib/format';
import type { PayPeriod, PayPeriodStatus } from '@/types/api';
import { usePayFrequencies, usePayPeriods } from '../api/hooks';

const PERIOD_STATUS_COLOR: Record<PayPeriodStatus, string> = {
  Open: 'blue',
  Locked: 'gold',
  Completed: 'green',
};

const PAY_YEAR = 2026;

function PayCalendar({ companyId }: { companyId: string }) {
  const frequenciesQuery = usePayFrequencies(companyId);
  const [payFrequencyId, setPayFrequencyId] = useState<string | undefined>(undefined);
  const periodsQuery = usePayPeriods(companyId, { payYear: PAY_YEAR, payFrequencyId });

  const columns: ColumnsType<PayPeriod> = [
    {
      title: 'Pay #',
      dataIndex: 'payNumber',
      key: 'payNumber',
      width: 90,
      align: 'right',
      render: (n: number) => <span className="num">{n}</span>,
    },
    { title: 'Begin', dataIndex: 'beginDate', key: 'begin', render: (d: string) => formatDate(d) },
    { title: 'End', dataIndex: 'endDate', key: 'end', render: (d: string) => formatDate(d) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s: PayPeriodStatus) => <Tag color={PERIOD_STATUS_COLOR[s]}>{s}</Tag>,
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {(frequenciesQuery.data ?? []).map((f) => (
          <Col key={f.id} xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title={`${humanize(f.code)}${f.isActive ? '' : ' (inactive)'}`}
                value={f.periodsPerYear}
                suffix="periods/yr"
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="All frequencies"
          style={{ width: 220 }}
          value={payFrequencyId}
          onChange={setPayFrequencyId}
          options={(frequenciesQuery.data ?? []).map((f) => ({
            value: f.id,
            label: humanize(f.code),
          }))}
        />
      </Space>

      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<PayPeriod>
          columns={columns}
          data={periodsQuery.data}
          isLoading={periodsQuery.isLoading}
          isError={periodsQuery.isError}
          error={periodsQuery.error}
          onRetry={() => periodsQuery.refetch()}
          emptyText={`No pay periods for ${PAY_YEAR}`}
        />
      </Card>
    </>
  );
}

/** Pay Calendar — Epic 5.1. Frequencies + managed periods (system Pay#), read view. */
export function PayCalendarPage() {
  const { activeCompanyId, activeCompany } = useTenantCompany();

  const subtitle = useMemo(
    () => (activeCompany ? `Managed pay periods for ${activeCompany.name}` : 'Managed pay periods'),
    [activeCompany],
  );

  return (
    <>
      <PageHeader
        title="Pay Calendar"
        subtitle={subtitle}
        breadcrumbs={[{ title: 'Home', href: '/' }, { title: 'Pay Calendar' }]}
      />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="System-managed Pay#"
        description="Pay periods carry a sequential Pay# that resets each calendar year and drives cumulative PAYE. Runs must be processed in Pay# order. Calendar generation is read-only this sprint."
      />
      {activeCompanyId ? (
        <PayCalendar companyId={activeCompanyId} />
      ) : (
        <Alert type="warning" showIcon message="Select a company to view its pay calendar." />
      )}
    </>
  );
}
