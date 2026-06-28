import { Card, Col, Row, Statistic, Typography } from 'antd';
import { PageHeader } from '@/components';
import { useAuth } from '@/app/providers/AuthContext';
import { useTenantCompany } from '@/app/providers/TenantCompanyContext';

/** Lightweight landing page for the shell. Real KPIs arrive with the payroll-run sprints. */
export function DashboardPage() {
  const { me } = useAuth();
  const { tenant, activeCompany, companies } = useTenantCompany();

  return (
    <>
      <PageHeader
        title={`Welcome, ${me?.displayName ?? ''}`.trim()}
        subtitle={tenant ? `${tenant.name} · ${activeCompany?.name ?? 'No company selected'}` : undefined}
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Companies (brands)" value={companies.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Active company" value={activeCompany?.code ?? '—'} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Roles" value={me?.roles?.length ?? 0} />
          </Card>
        </Col>
      </Row>
      <Typography.Paragraph type="secondary" style={{ marginTop: 24 }}>
        This is the Sprint&nbsp;1 foundation shell. Use the left navigation to reach the
        configuration &amp; master-data screens as they are built.
      </Typography.Paragraph>
    </>
  );
}
