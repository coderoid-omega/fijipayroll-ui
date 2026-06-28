import { useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { DataTable, PageHeader } from '@/components';
import { useTenantCompany } from '@/app/providers/TenantCompanyContext';
import type { Department, Lookup, Office } from '@/types/api';
import { useDepartments, useOccupations, useOffices } from '../api/hooks';
import { DepartmentFormDrawer } from '../components/DepartmentFormDrawer';

function statusTag(status: 'Active' | 'Inactive') {
  return <Tag color={status === 'Active' ? 'green' : 'default'}>{status}</Tag>;
}

function DepartmentsTab({ companyId }: { companyId: string }) {
  const { data, isLoading, isError, error, refetch } = useDepartments(companyId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Department | undefined>(undefined);

  const nameById = useMemo(
    () => new Map((data ?? []).map((d) => [d.id, `${d.code} — ${d.name}`])),
    [data],
  );

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (dept: Department) => {
    setEditing(dept);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<Department> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 120, render: (c) => <b>{c}</b> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Parent',
      dataIndex: 'parentDepartmentId',
      key: 'parent',
      render: (id: string | null) => (id ? (nameById.get(id) ?? '—') : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: Department['status']) => statusTag(s),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_: unknown, row) => (
        <Button type="link" size="small" onClick={() => openEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          New department
        </Button>
      </Space>
      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<Department>
          columns={columns}
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyText="No departments yet"
          emptyAction={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New department
            </Button>
          }
        />
      </Card>
      <DepartmentFormDrawer
        open={drawerOpen}
        companyId={companyId}
        departments={data ?? []}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

function OfficesTab({ companyId }: { companyId: string }) {
  const { data, isLoading, isError, error, refetch } = useOffices(companyId);
  const columns: ColumnsType<Office> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 120, render: (c) => <b>{c}</b> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: Office['status']) => statusTag(s),
    },
  ];
  return (
    <Card styles={{ body: { padding: 0 } }}>
      <DataTable<Office>
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        emptyText="No offices yet"
      />
    </Card>
  );
}

function OccupationsTab() {
  const { data, isLoading, isError, error, refetch } = useOccupations();
  const columns: ColumnsType<Lookup> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 120, render: (c) => <b>{c}</b> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
  ];
  return (
    <Card styles={{ body: { padding: 0 } }}>
      <DataTable<Lookup>
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        emptyText="No occupations defined"
      />
    </Card>
  );
}

/** Org lookups — Epic 5.2. Departments (CRUD) + Offices & Occupations (read). */
export function OrgLookupsPage() {
  const { activeCompanyId } = useTenantCompany();

  return (
    <>
      <PageHeader
        title="Org Lookups"
        subtitle="Departments, offices and occupations used across employee and payroll records."
        breadcrumbs={[{ title: 'Home', href: '/' }, { title: 'Org Lookups' }]}
      />
      {activeCompanyId ? (
        <Tabs
          items={[
            {
              key: 'departments',
              label: 'Departments',
              children: <DepartmentsTab companyId={activeCompanyId} />,
            },
            { key: 'offices', label: 'Offices', children: <OfficesTab companyId={activeCompanyId} /> },
            {
              key: 'occupations',
              label: 'Occupations',
              children: <OccupationsTab />,
            },
          ]}
        />
      ) : (
        <Alert type="warning" showIcon message="Select a company to manage its org lookups." />
      )}
    </>
  );
}
