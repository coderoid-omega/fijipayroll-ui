import type { ReactNode } from 'react';
import { Breadcrumb, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export interface BreadcrumbItem {
  title: ReactNode;
  href?: string;
}

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Primary action(s) shown on the right (e.g. a "New" button). */
  extra?: ReactNode;
}

/**
 * Consistent page header (CLAUDE.md §5) — title, breadcrumbs, primary action. Every routed page
 * renders one of these so the content area is visually uniform.
 */
export function PageHeader({ title, subtitle, breadcrumbs, extra }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={breadcrumbs.map((b) => ({
            title: b.href ? <Link to={b.href}>{b.title}</Link> : b.title,
          }))}
        />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <Space direction="vertical" size={2}>
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
          {subtitle && <Text type="secondary">{subtitle}</Text>}
        </Space>
        {extra && <Space wrap>{extra}</Space>}
      </div>
    </div>
  );
}
