import { useState } from 'react';
import { Alert, Badge, Button, Card, Descriptions, Flex, Progress, Skeleton, Tabs, Tag, Tooltip, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { PageHeader, QueryError } from '@/components';
import { useTenantCompany } from '@/app/providers/TenantCompanyContext';
import { formatDate } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import { humanize } from '@/lib/format';
import type { Employee } from '@/types/api';
import { useEmployee } from '../api/hooks';
import { sectionScores } from '../profileCompleteness';
import { EmployeeSectionDrawer, type EmployeeSection } from '../components/EmployeeSectionDrawer';
import { AssignLoginCodeModal } from '../components/AssignLoginCodeModal';

function dash(v: string | number | null | undefined): string {
  return v === null || v === undefined || v === '' ? '—' : String(v);
}

/**
 * The 360 form shell (Sprint 2 Epic 2): Personal · Statutory & Tax · Employment · Pay Details,
 * each editable via its own sectioned PATCH; later tabs (engagements, position timeline, YTD,
 * collections, audit) arrive with Epics 4-11. The completeness indicator combines the API's
 * authoritative `profileCompleteness` with the shared per-section map.
 */
function EmployeeDetail({
  employee,
  companyId,
  companyCode,
}: {
  employee: Employee;
  companyId: string;
  companyCode: string;
}) {
  const [editing, setEditing] = useState<EmployeeSection | null>(null);
  const [assigningLogin, setAssigningLogin] = useState(false);
  const scores = sectionScores(employee);
  const scoreOf = (key: EmployeeSection) => scores.find((s) => s.key === key)!;

  const sectionLabel = (key: EmployeeSection, label: string) => {
    const s = scoreOf(key);
    return (
      <Tooltip title={`${s.populated} of ${s.total} fields completed`}>
        <Badge
          size="small"
          count={`${s.populated}/${s.total}`}
          color={s.populated === s.total ? 'green' : 'orange'}
          offset={[14, 0]}
        >
          {label}
        </Badge>
      </Tooltip>
    );
  };

  const editButton = (key: EmployeeSection) => (
    <Button icon={<EditOutlined />} onClick={() => setEditing(key)} style={{ marginBottom: 12 }}>
      Edit section
    </Button>
  );

  const tabs = [
    {
      key: 'personal',
      label: sectionLabel('personal', 'Personal'),
      children: (
        <>
          {editButton('personal')}
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Employee code">{employee.employeeCode}</Descriptions.Item>
            <Descriptions.Item label="Login code">{dash(employee.loginCode)}</Descriptions.Item>
            <Descriptions.Item label="First name">{dash(employee.firstName)}</Descriptions.Item>
            <Descriptions.Item label="Last name">{dash(employee.lastName)}</Descriptions.Item>
            <Descriptions.Item label="Middle name">{dash(employee.middleName)}</Descriptions.Item>
            <Descriptions.Item label="Display name">{employee.displayName}</Descriptions.Item>
            <Descriptions.Item label="Date of birth">{formatDate(employee.dateOfBirth)}</Descriptions.Item>
            <Descriptions.Item label="Sex">{dash(employee.sex)}</Descriptions.Item>
            <Descriptions.Item label="Marital status">{dash(employee.maritalStatus)}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={employee.status === 'Active' ? 'green' : 'default'}>{employee.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </>
      ),
    },
    {
      key: 'statutoryTax',
      label: sectionLabel('statutoryTax', 'Statutory & Tax'),
      children: (
        <>
          {editButton('statutoryTax')}
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="TIN">{dash(employee.tin)}</Descriptions.Item>
            <Descriptions.Item label="FNPF #">{dash(employee.fnpfNo)}</Descriptions.Item>
            <Descriptions.Item label="Tax code">{dash(employee.taxCode)}</Descriptions.Item>
            <Descriptions.Item label="Tax type">{dash(employee.taxType)}</Descriptions.Item>
            <Descriptions.Item label="TCD date">{formatDate(employee.taxCodeDeclarationDate)}</Descriptions.Item>
            <Descriptions.Item label="Special tax rate">
              {employee.useSpecialTaxRate ? `${employee.specialTaxRate ?? 0}%` : 'No'}
            </Descriptions.Item>
          </Descriptions>
        </>
      ),
    },
    {
      key: 'employment',
      label: sectionLabel('employment', 'Employment'),
      children: (
        <>
          {editButton('employment')}
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Date of hire">{formatDate(employee.dateOfHire)}</Descriptions.Item>
            <Descriptions.Item label="Contract type">{dash(employee.contractTypeId && 'Set')}</Descriptions.Item>
            <Descriptions.Item label="Continuous service">{formatDate(employee.continuousServiceDate)}</Descriptions.Item>
            <Descriptions.Item label="Probation">
              {employee.probationStartDate
                ? `${formatDate(employee.probationStartDate)} → ${formatDate(employee.probationEndDate)}`
                : '—'}
            </Descriptions.Item>
          </Descriptions>
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="Engagements, stage history and position (division/department/grade/level) arrive with Epics 4-6"
            description="Placement, job and rate changes will be made through the transfer / regrade / rate-change actions so every change lands on the position timeline."
          />
        </>
      ),
    },
    {
      key: 'payDetails',
      label: sectionLabel('payDetails', 'Pay Details'),
      children: (
        <>
          {editButton('payDetails')}
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Pay type">{dash(employee.payType)}</Descriptions.Item>
            <Descriptions.Item label="Hourly rate">
              {employee.hourlyRate != null ? formatMoney(employee.hourlyRate) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Salary / period">
              {employee.salaryPerPeriod != null ? formatMoney(employee.salaryPerPeriod) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Standard hours">{dash(employee.standardHours)}</Descriptions.Item>
            <Descriptions.Item label="Payment method">
              {employee.paymentMethod ? humanize(employee.paymentMethod) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Gross-up">{employee.isGrossUp ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Bank">{dash(employee.bankName)}</Descriptions.Item>
            <Descriptions.Item label="Account #">{dash(employee.bankAccountNo)}</Descriptions.Item>
            <Descriptions.Item label="Branch">{dash(employee.bankBranch)}</Descriptions.Item>
          </Descriptions>
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="Rates are changed via the rate-change action (Epic 6)"
            description="The rate shown here is the current-position cache; the rate history timeline is authoritative."
          />
        </>
      ),
    },
    {
      key: 'ytd',
      label: 'Year to Date',
      children: (
        <Alert
          type="info"
          showIcon
          message="YTD totals arrive with Epic 7"
          description="Granular YTD (gross, tax/non-tax allowance, FNPF, PAYE, SRT, net, hours) and opening balances are captured per engagement."
        />
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Flex align="center" gap={16} wrap justify="space-between">
          <Flex align="center" gap={16}>
            <Progress
              type="circle"
              size={64}
              percent={employee.profileCompleteness ?? 0}
              status={(employee.profileCompleteness ?? 0) === 100 ? 'success' : 'normal'}
            />
            <div>
              <Typography.Text strong>Profile completeness</Typography.Text>
              <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                The progressive profile (OQ-04): onboard with the core, complete each section later.
                {' '}
                {scores.map((s) => `${s.label} ${s.populated}/${s.total}`).join(' · ')}
              </Typography.Paragraph>
            </div>
          </Flex>
          {/* Epic 3: a login CODE, not a credential — canLogin stays false until the
              set-password flow (a later epic), so the honest state is "credentials pending". */}
          <div>
            {employee.loginCode ? (
              <Flex align="center" gap={8}>
                <Tag color="blue">Login code: {employee.loginCode}</Tag>
                {!employee.canLogin && <Tag color="orange">credentials pending</Tag>}
              </Flex>
            ) : (
              <Button onClick={() => setAssigningLogin(true)}>Assign login code</Button>
            )}
          </div>
        </Flex>
      </Card>
      <Card>
        <Tabs items={tabs} />
      </Card>
      {editing && (
        <EmployeeSectionDrawer
          open
          section={editing}
          companyId={companyId}
          employee={employee}
          onClose={() => setEditing(null)}
        />
      )}
      <AssignLoginCodeModal
        open={assigningLogin}
        companyId={companyId}
        companyCode={companyCode}
        employee={employee}
        onClose={() => setAssigningLogin(false)}
      />
    </>
  );
}

/** Employee 360 (Sprint 2 Epic 2: sectioned editing + completeness; read scaffold was Sprint 1). */
export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeCompanyId, activeCompany } = useTenantCompany();
  const { data, isLoading, isError, error, refetch } = useEmployee(activeCompanyId ?? '', id);

  return (
    <>
      <PageHeader
        title={data?.displayName ?? 'Employee'}
        subtitle={data?.employeeCode}
        breadcrumbs={[
          { title: 'Home', href: '/' },
          { title: 'Employees', href: '/employees' },
          { title: data?.displayName ?? 'Detail' },
        ]}
      />
      {isLoading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : isError ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : data && activeCompanyId ? (
        <EmployeeDetail
          employee={data}
          companyId={activeCompanyId}
          companyCode={activeCompany?.code ?? ''}
        />
      ) : (
        <Alert type="warning" showIcon message="Employee not found." />
      )}
    </>
  );
}
