import { useState } from 'react';
import { App as AntApp, Button, Input, Popconfirm, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, StarFilled } from '@ant-design/icons';
import { DataTable, PageHeader } from '@/components';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { isApiError } from '@/lib/apiError';
import type { Company } from '@/types/api';
import { useCompanies, useSetPrimaryCompany } from '../api/hooks';
import { CompanyFormDrawer } from '../components/CompanyFormDrawer';

/** Companies (brands) list — Epic 2.1 + 2.3. The sprint headline screen (D11). */
export function CompaniesListPage() {
  const { message } = AntApp.useApp();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const companiesQuery = useCompanies({ page, pageSize, search });
  const setPrimary = useSetPrimaryCompany();

  const openCreate = () => {
    setEditingId(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setDrawerOpen(true);
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimary.mutateAsync(id);
      message.success('Primary company updated');
    } catch (err) {
      message.error(isApiError(err) ? err.message : 'Could not set primary');
    }
  };

  const columns: ColumnsType<Company> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string, row) => (
        <Space>
          <span style={{ fontWeight: 600 }}>{code}</span>
          {row.isPrimary && (
            <Tag color="blue" icon={<StarFilled />}>
              Primary
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, row) => (
        <Space direction="vertical" size={0}>
          <span>{name}</span>
          {row.legalName && (
            <span style={{ fontSize: 12, color: '#90a0b3' }}>{row.legalName}</span>
          )}
        </Space>
      ),
    },
    { title: 'FNPF #', dataIndex: 'fnpfEmployerNo', key: 'fnpf', render: (v) => v ?? '—' },
    { title: 'TIN', dataIndex: 'tin', key: 'tin', render: (v) => v ?? '—' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: Company['status']) => (
        <Tag color={status === 'Active' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: unknown, row) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(row.id)}>
            Edit
          </Button>
          {row.isPrimary ? (
            <Button type="link" size="small" disabled>
              Primary
            </Button>
          ) : (
            <Popconfirm
              title="Set as primary?"
              description="Exactly one company can be primary. This will replace the current one."
              okText="Set primary"
              onConfirm={() => handleSetPrimary(row.id)}
            >
              <Button type="link" size="small" loading={setPrimary.isPending}>
                Set primary
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Companies"
        subtitle="Brands within this tenant. Exactly one is the primary company."
        breadcrumbs={[{ title: 'Home', href: '/' }, { title: 'Companies' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New company
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Search by code or name"
          style={{ width: 280 }}
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
        />
      </Space>

      <DataTable<Company>
        columns={columns}
        data={companiesQuery.data?.items}
        isLoading={companiesQuery.isLoading}
        isError={companiesQuery.isError}
        error={companiesQuery.error}
        onRetry={() => companiesQuery.refetch()}
        emptyText="No companies yet"
        emptyAction={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New company
          </Button>
        }
        serverPagination={{
          page,
          pageSize,
          total: companiesQuery.data?.total ?? 0,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          },
        }}
      />

      <CompanyFormDrawer
        open={drawerOpen}
        companyId={editingId}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
