import { Alert, Card, Descriptions, Skeleton, Tabs, Tag } from 'antd';
import { useParams } from 'react-router-dom';
import { PageHeader, QueryError } from '@/components';
import { useTenantCompany } from '@/app/providers/TenantCompanyContext';
import { formatDate } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import { humanize } from '@/lib/format';
import type { Employee } from '@/types/api';
import { useEmployee } from '../api/hooks';

function dash(v: string | number | null | undefined): string {
  return v === null || v === undefined || v === '' ? '—' : String(v);
}

function EmployeeDetail({ employee }: { employee: Employee }) {
  const tabs = [
    {
      key: 'details',
      label: 'Employee Details',
      children: (
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Employee code">{employee.employeeCode}</Descriptions.Item>
          <Descriptions.Item label="Login code">{dash(employee.loginCode)}</Descriptions.Item>
          <Descriptions.Item label="Display name">{employee.displayName}</Descriptions.Item>
          <Descriptions.Item label="First name">{dash(employee.firstName)}</Descriptions.Item>
          <Descriptions.Item label="Last name">{dash(employee.lastName)}</Descriptions.Item>
          <Descriptions.Item label="Date of birth">
            {formatDate(employee.dateOfBirth)}
          </Descriptions.Item>
          <Descriptions.Item label="Date of hire">{formatDate(employee.dateOfHire)}</Descriptions.Item>
          <Descriptions.Item label="FNPF #">{dash(employee.fnpfNo)}</Descriptions.Item>
          <Descriptions.Item label="TIN">{dash(employee.tin)}</Descriptions.Item>
          <Descriptions.Item label="Tax code">{dash(employee.taxCode)}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={employee.status === 'Active' ? 'green' : 'default'}>{employee.status}</Tag>
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'pay',
      label: 'Pay Details',
      children: (
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Pay type">{dash(employee.payType)}</Descriptions.Item>
          <Descriptions.Item label="Tax type">{dash(employee.taxType)}</Descriptions.Item>
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
          <Descriptions.Item label="Special tax rate">
            {employee.useSpecialTaxRate ? `${employee.specialTaxRate ?? 0}%` : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="Gross-up">{employee.isGrossUp ? 'Yes' : 'No'}</Descriptions.Item>
          <Descriptions.Item label="Bank">{dash(employee.bankName)}</Descriptions.Item>
          <Descriptions.Item label="Account #">{dash(employee.bankAccountNo)}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'ytd',
      label: 'Year to Date',
      children: (
        <Alert
          type="info"
          showIcon
          message="YTD totals arrive in Sprint 2"
          description="Granular YTD (gross, tax/non-tax allowance, FNPF, PAYE, SRT, net, hours) and monthly employee/employer FNPF are needed for cumulative PAYE — captured with the full employee record in Sprint 2."
        />
      ),
    },
  ];

  return (
    <Card>
      <Tabs items={tabs} />
    </Card>
  );
}

/** Read-only employee detail — Sprint 1 stretch scaffold. */
export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeCompanyId } = useTenantCompany();
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
      ) : data ? (
        <EmployeeDetail employee={data} />
      ) : (
        <Alert type="warning" showIcon message="Employee not found." />
      )}
    </>
  );
}
