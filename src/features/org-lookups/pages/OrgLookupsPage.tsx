import { useMemo, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Flex, Menu, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { DataTable, PageHeader, ScopeTag, type DataScope } from '@/components';
import { useTenantCompany } from '@/app/providers/TenantCompanyContext';
import type {
  CompanyLookup,
  ContractType,
  Department,
  EmploymentStage,
  ExitReason,
  Lookup,
  Office,
} from '@/types/api';
import {
  useCompanyLookups,
  useContractTypes,
  useDepartments,
  useEmploymentStages,
  useExitReasons,
  useOccupations,
  useOffices,
  useTenantConfigLookups,
} from '../api/hooks';
import type { CompanyLookupResource, TenantConfigLookupResource } from '../api/orgApi';
import { DepartmentFormDrawer } from '../components/DepartmentFormDrawer';
import { OfficeFormDrawer } from '../components/OfficeFormDrawer';
import { OccupationFormDrawer } from '../components/OccupationFormDrawer';
import { CompanyLookupFormDrawer } from '../components/CompanyLookupFormDrawer';
import { ContractTypeFormDrawer } from '../components/ContractTypeFormDrawer';
import { EmploymentStageFormDrawer } from '../components/EmploymentStageFormDrawer';
import { ExitReasonFormDrawer } from '../components/ExitReasonFormDrawer';
import { TenantConfigLookupFormDrawer } from '../components/TenantConfigLookupFormDrawer';

function statusTag(status: 'Active' | 'Inactive') {
  return <Tag color={status === 'Active' ? 'green' : 'default'}>{status}</Tag>;
}

function flagTag(value: boolean) {
  return value ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>;
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Office | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (office: Office) => {
    setEditing(office);
    setDrawerOpen(true);
  };

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
          New office
        </Button>
      </Space>
      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<Office>
          columns={columns}
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyText="No offices yet"
          emptyAction={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New office
            </Button>
          }
        />
      </Card>
      <OfficeFormDrawer
        open={drawerOpen}
        companyId={companyId}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

function CompanyLookupTab({
  resource,
  entityLabel,
  companyId,
}: {
  resource: CompanyLookupResource;
  /** Singular label, e.g. "division". */
  entityLabel: string;
  companyId: string;
}) {
  const { data, isLoading, isError, error, refetch } = useCompanyLookups(resource, companyId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyLookup | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (row: CompanyLookup) => {
    setEditing(row);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<CompanyLookup> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (c: string | null) => (c ? <b>{c}</b> : '—'),
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: CompanyLookup['status']) => statusTag(s),
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
          New {entityLabel}
        </Button>
      </Space>
      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<CompanyLookup>
          columns={columns}
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyText={`No ${entityLabel}s yet`}
          emptyAction={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New {entityLabel}
            </Button>
          }
        />
      </Card>
      <CompanyLookupFormDrawer
        open={drawerOpen}
        resource={resource}
        entityLabel={entityLabel}
        companyId={companyId}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

function OccupationsTab() {
  const { data, isLoading, isError, error, refetch } = useOccupations();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Lookup | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (occ: Lookup) => {
    setEditing(occ);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<Lookup> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 120, render: (c) => <b>{c}</b> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
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
          New occupation
        </Button>
      </Space>
      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<Lookup>
          columns={columns}
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyText="No occupations defined"
          emptyAction={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New occupation
            </Button>
          }
        />
      </Card>
      <OccupationFormDrawer open={drawerOpen} editing={editing} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function ContractTypesTab() {
  const { data, isLoading, isError, error, refetch } = useContractTypes();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ContractType | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (row: ContractType) => {
    setEditing(row);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<ContractType> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 120, render: (c) => <b>{c}</b> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Fixed-term',
      dataIndex: 'isFixedTerm',
      key: 'isFixedTerm',
      width: 110,
      render: (v: boolean) => flagTag(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: ContractType['status']) => statusTag(s),
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
          New contract type
        </Button>
      </Space>
      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<ContractType>
          columns={columns}
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyText="No contract types defined"
          emptyAction={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New contract type
            </Button>
          }
        />
      </Card>
      <ContractTypeFormDrawer open={drawerOpen} editing={editing} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function EmploymentStagesTab() {
  const { data, isLoading, isError, error, refetch } = useEmploymentStages();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<EmploymentStage | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (row: EmploymentStage) => {
    setEditing(row);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<EmploymentStage> = [
    { title: 'Order', dataIndex: 'ordinal', key: 'ordinal', width: 80 },
    { title: 'Code', dataIndex: 'code', key: 'code', width: 120, render: (c) => <b>{c}</b> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Probationary',
      dataIndex: 'isProbationary',
      key: 'isProbationary',
      width: 120,
      render: (v: boolean) => flagTag(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: EmploymentStage['status']) => statusTag(s),
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
          New employment stage
        </Button>
      </Space>
      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<EmploymentStage>
          columns={columns}
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyText="No employment stages defined"
          emptyAction={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New employment stage
            </Button>
          }
        />
      </Card>
      <EmploymentStageFormDrawer open={drawerOpen} editing={editing} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function ExitReasonsTab() {
  const { data, isLoading, isError, error, refetch } = useExitReasons();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ExitReason | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (row: ExitReason) => {
    setEditing(row);
    setDrawerOpen(true);
  };

  // The flags ARE the behaviour (D10): severance/notice logic downstream reads these columns,
  // never the code — so the table surfaces all four flags.
  const columns: ColumnsType<ExitReason> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 110, render: (c) => <b>{c}</b> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Initiated by', dataIndex: 'initiator', key: 'initiator', width: 110 },
    {
      title: 'Severance',
      dataIndex: 'severanceEligible',
      key: 'severanceEligible',
      width: 100,
      render: (v: boolean) => flagTag(v),
    },
    {
      title: 'Notice',
      dataIndex: 'noticeRequired',
      key: 'noticeRequired',
      width: 90,
      render: (v: boolean) => flagTag(v),
    },
    {
      title: 'Rehire',
      dataIndex: 'rehireEligible',
      key: 'rehireEligible',
      width: 90,
      render: (v: boolean) => flagTag(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: ExitReason['status']) => statusTag(s),
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
          New exit reason
        </Button>
      </Space>
      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<ExitReason>
          columns={columns}
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyText="No exit reasons defined"
          emptyAction={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New exit reason
            </Button>
          }
        />
      </Card>
      <ExitReasonFormDrawer open={drawerOpen} editing={editing} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function TenantConfigLookupTab({
  resource,
  entityLabel,
}: {
  resource: TenantConfigLookupResource;
  /** Singular label, e.g. "work-permit type". */
  entityLabel: string;
}) {
  const { data, isLoading, isError, error, refetch } = useTenantConfigLookups(resource);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Lookup | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setDrawerOpen(true);
  };
  const openEdit = (row: Lookup) => {
    setEditing(row);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<Lookup> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 120, render: (c) => <b>{c}</b> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
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
          New {entityLabel}
        </Button>
      </Space>
      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<Lookup>
          columns={columns}
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyText={`No ${entityLabel}s defined`}
          emptyAction={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New {entityLabel}
            </Button>
          }
        />
      </Card>
      <TenantConfigLookupFormDrawer
        open={drawerOpen}
        resource={resource}
        entityLabel={entityLabel}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

/** One entry in the master–detail catalogue. Add new masters here — the menu, routing and
 * scope grouping all derive from this list. */
interface MasterDef {
  /** URL segment + menu key, e.g. /org-lookups/divisions. */
  key: string;
  label: string;
  scope: DataScope;
  render: (companyId: string) => ReactNode;
}

const MASTERS: MasterDef[] = [
  {
    key: 'departments',
    label: 'Departments',
    scope: 'company',
    render: (companyId) => <DepartmentsTab companyId={companyId} />,
  },
  {
    key: 'offices',
    label: 'Offices',
    scope: 'company',
    render: (companyId) => <OfficesTab companyId={companyId} />,
  },
  {
    key: 'divisions',
    label: 'Divisions',
    scope: 'company',
    render: (companyId) => (
      <CompanyLookupTab resource="divisions" entityLabel="division" companyId={companyId} />
    ),
  },
  {
    key: 'sections',
    label: 'Sections',
    scope: 'company',
    render: (companyId) => (
      <CompanyLookupTab resource="sections" entityLabel="section" companyId={companyId} />
    ),
  },
  {
    key: 'grades',
    label: 'Grades',
    scope: 'company',
    render: (companyId) => (
      <CompanyLookupTab resource="grades" entityLabel="grade" companyId={companyId} />
    ),
  },
  {
    key: 'levels',
    label: 'Levels',
    scope: 'company',
    render: (companyId) => (
      <CompanyLookupTab resource="levels" entityLabel="level" companyId={companyId} />
    ),
  },
  {
    key: 'occupations',
    label: 'Occupations',
    scope: 'tenant',
    render: () => <OccupationsTab />,
  },
  // Employee-config lookups (Sprint 2 Epic 1) — ALL tenant-wide (OQ-24): grounded in national
  // law (ERA 2007 / Immigration Act 2003) or universal, so they sit in the shared group.
  {
    key: 'contract-types',
    label: 'Contract Types',
    scope: 'tenant',
    render: () => <ContractTypesTab />,
  },
  {
    key: 'employment-stages',
    label: 'Employment Stages',
    scope: 'tenant',
    render: () => <EmploymentStagesTab />,
  },
  {
    key: 'exit-reasons',
    label: 'Exit Reasons',
    scope: 'tenant',
    render: () => <ExitReasonsTab />,
  },
  {
    key: 'work-permit-types',
    label: 'Work-Permit Types',
    scope: 'tenant',
    render: () => (
      <TenantConfigLookupTab resource="work-permit-types" entityLabel="work-permit type" />
    ),
  },
  {
    key: 'relationship-types',
    label: 'Relationship Types',
    scope: 'tenant',
    render: () => (
      <TenantConfigLookupTab resource="relationship-types" entityLabel="relationship type" />
    ),
  },
  {
    key: 'document-types',
    label: 'Document Types',
    scope: 'tenant',
    render: () => <TenantConfigLookupTab resource="document-types" entityLabel="document type" />,
  },
];

/**
 * Org lookups — a master–detail catalogue of the org-structure masters (all CRUD).
 * The left menu is grouped by scope (company-specific vs shared tenant-wide), so the group
 * headers carry the D11 data scope; the selected master is part of the URL and deep-linkable.
 */
export function OrgLookupsPage() {
  const { activeCompanyId, activeCompany } = useTenantCompany();
  const { master } = useParams<{ master?: string }>();
  const navigate = useNavigate();
  const companyName = activeCompany?.name ?? null;

  const active = MASTERS.find((m) => m.key === (master ?? MASTERS[0]!.key));
  if (!active) return <Navigate to="/org-lookups" replace />;

  const menuItems: MenuProps['items'] = [
    {
      type: 'group',
      key: 'company-scope',
      label: `Company — ${companyName ?? 'active company'}`,
      children: MASTERS.filter((m) => m.scope === 'company').map((m) => ({
        key: m.key,
        label: m.label,
      })),
    },
    {
      type: 'group',
      key: 'tenant-scope',
      label: 'Shared — all companies',
      children: MASTERS.filter((m) => m.scope === 'tenant').map((m) => ({
        key: m.key,
        label: m.label,
      })),
    },
  ];

  return (
    <>
      <PageHeader
        title="Org Lookups"
        subtitle="Org-structure masters used across employee and payroll records, grouped by scope: company masters belong to the active company; shared masters are visible to every company in your organisation."
        breadcrumbs={[{ title: 'Home', href: '/' }, { title: 'Org Lookups' }]}
      />
      {activeCompanyId ? (
        <Flex gap={16} align="flex-start" wrap>
          <Card styles={{ body: { padding: 8 } }} style={{ width: 248, flexShrink: 0 }}>
            <Menu
              mode="inline"
              items={menuItems}
              selectedKeys={[active.key]}
              onClick={({ key }) => navigate(`/org-lookups/${key}`)}
              style={{ borderInlineEnd: 'none' }}
            />
          </Card>
          <div style={{ flex: 1, minWidth: 320 }}>
            <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {active.label}
              </Typography.Title>
              <ScopeTag scope={active.scope} companyName={companyName} />
            </Flex>
            {active.render(activeCompanyId)}
          </div>
        </Flex>
      ) : (
        <Alert type="warning" showIcon message="Select a company to manage its org lookups." />
      )}
    </>
  );
}
