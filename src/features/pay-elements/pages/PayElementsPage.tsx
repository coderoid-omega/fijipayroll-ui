import { useState } from 'react';
import { Alert, Button, Input, Select, Space, Tabs, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { DataTable, PageHeader } from '@/components';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { useTenantCompany } from '@/app/providers/TenantCompanyContext';
import { formatDate } from '@/lib/date';
import type { PayElement } from '@/types/api';
import { usePayElements, usePayGroups } from '../api/hooks';
import { PayElementFormDrawer } from '../components/PayElementFormDrawer';
import { PayGroupsReference } from '../components/PayGroupsReference';

/** Compact flag tags for the list. */
function FlagTags({ element }: { element: PayElement }) {
  const flags: { on: boolean | undefined; label: string; color: string }[] = [
    { on: element.isPayeAble, label: 'PAYE', color: 'geekblue' },
    { on: element.isFnpfAble, label: 'FNPF', color: 'cyan' },
    { on: element.isOneTimeForTax, label: '1-time', color: 'gold' },
    { on: element.isPreTax, label: 'pre-tax', color: 'purple' },
    { on: element.isPostTax, label: 'post-tax', color: 'magenta' },
    { on: element.hasGoalAmount, label: 'goal', color: 'green' },
  ];
  return (
    <Space size={[4, 4]} wrap>
      {flags.filter((f) => f.on).map((f) => (
        <Tag key={f.label} color={f.color} style={{ marginInlineEnd: 0 }}>
          {f.label}
        </Tag>
      ))}
    </Space>
  );
}

function PayElementsList({ companyId }: { companyId: string }) {
  const [search, setSearch] = useState('');
  const [payGroupCode, setPayGroupCode] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const groupsQuery = usePayGroups();
  const listQuery = usePayElements(companyId, { page, pageSize, search, payGroupCode });

  const openCreate = () => {
    setEditingId(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<PayElement> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 90, render: (c) => <b>{c}</b> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Group',
      dataIndex: 'payGroupCode',
      key: 'group',
      width: 90,
      render: (g: string) => <Tag color="blue">{g}</Tag>,
    },
    { title: 'Type', dataIndex: 'calcType', key: 'type', width: 110 },
    {
      title: 'E-Rate',
      dataIndex: 'eRate',
      key: 'eRate',
      width: 90,
      align: 'right',
      render: (r: number) => <span className="num">{r.toFixed(2)}×</span>,
    },
    { title: 'Flags', key: 'flags', render: (_: unknown, row) => <FlagTags element={row} /> },
    {
      title: 'Effective from',
      dataIndex: 'validFrom',
      key: 'validFrom',
      width: 130,
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: PayElement['status']) => (
        <Tag color={s === 'Active' ? 'green' : 'default'}>{s}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_: unknown, row) => (
        <Button type="link" size="small" onClick={() => openEdit(row.id)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search
          allowClear
          placeholder="Search code or description"
          style={{ width: 260 }}
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
        />
        <Select
          allowClear
          placeholder="Filter by pay group"
          style={{ width: 220 }}
          value={payGroupCode}
          onChange={(value) => {
            setPage(1);
            setPayGroupCode(value);
          }}
          options={(groupsQuery.data ?? []).map((g) => ({
            value: g.code,
            label: `${g.code} — ${g.name}`,
          }))}
        />
        <Tooltip title="Add a new pay element">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New pay element
          </Button>
        </Tooltip>
      </Space>

      <DataTable<PayElement>
        columns={columns}
        data={listQuery.data?.items}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        error={listQuery.error}
        onRetry={() => listQuery.refetch()}
        emptyText="No pay elements for this company yet"
        emptyAction={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New pay element
          </Button>
        }
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

      <PayElementFormDrawer
        open={drawerOpen}
        companyId={companyId}
        payGroups={groupsQuery.data ?? []}
        elementId={editingId}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

/** Pay Elements — Epic 3. Company-scoped pay codes plus the 14-group reference. */
export function PayElementsPage() {
  const { activeCompanyId, activeCompany } = useTenantCompany();

  return (
    <>
      <PageHeader
        title="Pay Elements"
        subtitle={
          activeCompany
            ? `Pay codes for ${activeCompany.name}`
            : 'Pay codes (company-scoped)'
        }
        breadcrumbs={[{ title: 'Home', href: '/' }, { title: 'Pay Elements' }]}
      />
      {activeCompanyId ? (
        <Tabs
          items={[
            {
              key: 'elements',
              label: 'Pay Elements',
              children: <PayElementsList companyId={activeCompanyId} />,
            },
            {
              key: 'groups',
              label: 'Pay Groups (14)',
              children: <PayGroupsReference />,
            },
          ]}
        />
      ) : (
        <Alert type="warning" showIcon message="Select a company to manage its pay elements." />
      )}
    </>
  );
}
