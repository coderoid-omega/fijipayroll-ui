import { useState } from 'react';
import { Alert, Card, Input, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { DataTable, PageHeader } from '@/components';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { useTenantCompany } from '@/app/providers/TenantCompanyContext';
import { formatDate } from '@/lib/date';
import type { EmployeeSummary } from '@/types/api';
import { useEmployees } from '../api/hooks';

function EmployeesList({ companyId }: { companyId: string }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const listQuery = useEmployees(companyId, { page, pageSize, search });

  const columns: ColumnsType<EmployeeSummary> = [
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode', width: 110, render: (c) => <b>{c}</b> },
    { title: 'Name', dataIndex: 'displayName', key: 'name' },
    {
      title: 'Tax code',
      dataIndex: 'taxCode',
      key: 'taxCode',
      width: 100,
      render: (t: string | undefined) => (t ? <Tag>{t}</Tag> : '—'),
    },
    { title: 'Pay type', dataIndex: 'payType', key: 'payType', width: 110, render: (v) => v ?? '—' },
    { title: 'FNPF #', dataIndex: 'fnpfNo', key: 'fnpf', render: (v) => v ?? '—' },
    {
      title: 'Hired',
      dataIndex: 'dateOfHire',
      key: 'hired',
      width: 130,
      render: (d: string | null) => formatDate(d),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: EmployeeSummary['status']) => (
        <Tag color={s === 'Active' ? 'green' : s === 'Suspended' ? 'orange' : s === 'Terminated' ? 'red' : 'default'}>
          {s}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Search by employee code, name, TIN or FNPF #"
          style={{ width: 320 }}
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
        />
      </Space>
      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<EmployeeSummary>
          columns={columns}
          data={listQuery.data?.items}
          isLoading={listQuery.isLoading}
          isError={listQuery.isError}
          error={listQuery.error}
          onRetry={() => listQuery.refetch()}
          emptyText="No employees for this company yet"
          onRow={(row) => ({
            onClick: () => navigate(`/employees/${row.id}`),
            style: { cursor: 'pointer' },
          })}
          serverPagination={{
            page,
            pageSize,
            total: listQuery.data?.total ?? 0,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
        />
      </Card>
    </>
  );
}

/** Employees list — Sprint 1 stretch (read-only; full CRUD is Sprint 2). */
export function EmployeesListPage() {
  const { activeCompanyId, activeCompany } = useTenantCompany();

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={activeCompany ? `Employees of ${activeCompany.name}` : 'Employees (company-scoped)'}
        breadcrumbs={[{ title: 'Home', href: '/' }, { title: 'Employees' }]}
      />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Read-only preview"
        description="This is a Sprint 1 stretch view. Full employee create/edit (and YTD balances) arrives in Sprint 2."
      />
      {activeCompanyId ? (
        <EmployeesList companyId={activeCompanyId} />
      ) : (
        <Alert type="warning" showIcon message="Select a company to view its employees." />
      )}
    </>
  );
}
