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
import { useContractTypeOptions, useEmployee, useEmploymentStageOptions } from '../api/hooks';
import { sectionScores } from '../profileCompleteness';
import { EmployeeSectionDrawer, type EmployeeSection } from '../components/EmployeeSectionDrawer';
import { AssignLoginCodeModal } from '../components/AssignLoginCodeModal';
import { StageHistoryTab } from '../components/StageHistoryTab';
import { PositionTimelineTab } from '../components/PositionTimelineTab';
import {
  ContractChangeModal,
  ContractTermModal,
  ExtendProbationModal,
  StageChangeModal,
  type LifecycleAction,
} from '../components/LifecycleActionModals';
import {
  LiftSuspensionModal,
  RehireModal,
  SuspendModal,
  TerminateModal,
  type StatusAction,
} from '../components/StatusActionModals';
import {
  RateChangeModal,
  RegradeModal,
  type PositionAction,
} from '../components/PositionActionModals';

function dash(v: string | number | null | undefined): string {
  return v === null || v === undefined || v === '' ? '—' : String(v);
}

type SectionKey = ReturnType<typeof sectionScores>[number]['key'];

/**
 * The 360 form shell (Sprint 2 Epic 2): Personal · Statutory & Tax · Employment · Pay Details,
 * each editable via its own sectioned PATCH — except Employment (Epic 4): its fields are a cache
 * of the CURRENT engagement, written only by the lifecycle actions (stage-change /
 * extend-probation / contract-change), never by PATCH. The Stage & History tab shows the
 * resulting business timelines. Later tabs (position timeline, YTD, collections, audit) arrive
 * with Epics 6-11.
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
  const [action, setAction] = useState<LifecycleAction | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [positionAction, setPositionAction] = useState<PositionAction | null>(null);
  const contractTypes = useContractTypeOptions();
  const stages = useEmploymentStageOptions();
  const scores = sectionScores(employee);
  const scoreOf = (key: SectionKey) => scores.find((s) => s.key === key)!;
  const contractTypeName =
    contractTypes.data?.find((c) => c.id === employee.contractTypeId)?.name ??
    (employee.contractTypeId ? 'Set' : null);
  const stageName =
    stages.data?.find((s) => s.id === employee.stageId)?.name ?? (employee.stageId ? 'Set' : null);

  const sectionLabel = (key: SectionKey, label: string) => {
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
          {/* Epic 4: no Edit drawer here — these are engagement-cache fields, written only by
              the lifecycle actions so every change lands on the business timeline. */}
          <Flex gap={8} wrap style={{ marginBottom: 12 }}>
            <Button onClick={() => setAction('stage-change')}>Change stage</Button>
            <Button onClick={() => setAction('extend-probation')}>Extend probation</Button>
            <Button onClick={() => setAction('contract-change')}>Change contract type</Button>
            <Button onClick={() => setAction('contract-term')}>Add contract term</Button>
            <Button onClick={() => setPositionAction('regrade')}>Regrade</Button>
            <Button onClick={() => setPositionAction('rate-change')}>Change rate</Button>
          </Flex>
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Date of hire">{formatDate(employee.dateOfHire)}</Descriptions.Item>
            <Descriptions.Item label="Contract type">{dash(contractTypeName)}</Descriptions.Item>
            <Descriptions.Item label="Stage">{dash(stageName)}</Descriptions.Item>
            <Descriptions.Item label="Continuous service">{formatDate(employee.continuousServiceDate)}</Descriptions.Item>
            <Descriptions.Item label="Probation">
              {employee.probationStartDate || employee.probationEndDate
                ? `${formatDate(employee.probationStartDate)} → ${formatDate(employee.probationEndDate)}`
                : '—'}
            </Descriptions.Item>
          </Descriptions>
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="These fields mirror the current engagement"
            description="Contract type, stage, continuous service and probation are owned by the actions above and recorded on the Stage & History tab; regrade and rate change are recorded on the Position Timeline tab. Backdating is safe — every change is a new row and current values resolve as-of today. Transfer arrives with Epic 8."
          />
        </>
      ),
    },
    {
      key: 'stageHistory',
      label: 'Stage & History',
      children: <StageHistoryTab companyId={companyId} employee={employee} />,
    },
    {
      key: 'positionTimeline',
      label: 'Position Timeline',
      children: <PositionTimelineTab companyId={companyId} employee={employee} />,
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
          <Flex vertical align="end" gap={8}>
            <div>
              {employee.loginCode ? (
                <Flex align="center" gap={8}>
                  <Tag color="blue">Login code: {employee.loginCode}</Tag>
                  {!employee.canLogin && <Tag color="orange">credentials pending</Tag>}
                </Flex>
              ) : (
                <Button onClick={() => setAssigningLogin(true)} disabled={employee.status === 'Terminated'}>
                  Assign login code
                </Button>
              )}
            </div>
            {/* Epic 5: the status machine, source of truth in the API — Active→Suspended ·
                Suspended→Active · Active|Suspended→Terminated · Terminated→Active. The UI offers
                exactly those transitions and nothing else. */}
            <Flex gap={8} wrap>
              {employee.status === 'Active' && (
                <Button onClick={() => setStatusAction('suspend')}>Suspend</Button>
              )}
              {employee.status === 'Suspended' && (
                <Button onClick={() => setStatusAction('lift-suspension')}>Lift suspension</Button>
              )}
              {(employee.status === 'Active' || employee.status === 'Suspended') && (
                <Button danger onClick={() => setStatusAction('terminate')}>Terminate</Button>
              )}
              {employee.status === 'Terminated' && (
                <Button type="primary" onClick={() => setStatusAction('rehire')}>Rehire</Button>
              )}
            </Flex>
          </Flex>
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
      <StageChangeModal
        open={action === 'stage-change'}
        companyId={companyId}
        employee={employee}
        onClose={() => setAction(null)}
      />
      <ExtendProbationModal
        open={action === 'extend-probation'}
        companyId={companyId}
        employee={employee}
        onClose={() => setAction(null)}
      />
      <ContractChangeModal
        open={action === 'contract-change'}
        companyId={companyId}
        employee={employee}
        onClose={() => setAction(null)}
      />
      <ContractTermModal
        open={action === 'contract-term'}
        companyId={companyId}
        employee={employee}
        onClose={() => setAction(null)}
      />
      <SuspendModal
        open={statusAction === 'suspend'}
        companyId={companyId}
        employee={employee}
        onClose={() => setStatusAction(null)}
      />
      <LiftSuspensionModal
        open={statusAction === 'lift-suspension'}
        companyId={companyId}
        employee={employee}
        onClose={() => setStatusAction(null)}
      />
      <TerminateModal
        open={statusAction === 'terminate'}
        companyId={companyId}
        employee={employee}
        onClose={() => setStatusAction(null)}
      />
      <RehireModal
        open={statusAction === 'rehire'}
        companyId={companyId}
        employee={employee}
        onClose={() => setStatusAction(null)}
      />
      <RegradeModal
        open={positionAction === 'regrade'}
        companyId={companyId}
        employee={employee}
        onClose={() => setPositionAction(null)}
      />
      <RateChangeModal
        open={positionAction === 'rate-change'}
        companyId={companyId}
        employee={employee}
        onClose={() => setPositionAction(null)}
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
