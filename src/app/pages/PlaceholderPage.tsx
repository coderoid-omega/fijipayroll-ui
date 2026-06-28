import { Alert, Card } from 'antd';
import { PageHeader } from '@/components';
import { navLabelByPath } from '@/app/layout/navConfig';

interface PlaceholderPageProps {
  path: string;
  epic: string;
  description?: string;
}

/**
 * Temporary page for feature areas not yet built. Keeps the shell fully navigable during Epic 0;
 * each is replaced by the real screen in its sprint epic.
 */
export function PlaceholderPage({ path, epic, description }: PlaceholderPageProps) {
  const title = navLabelByPath[path] ?? 'Coming soon';
  return (
    <>
      <PageHeader title={title} breadcrumbs={[{ title: 'Home', href: '/' }, { title }]} />
      <Card>
        <Alert
          type="info"
          showIcon
          message={`${title} — ${epic}`}
          description={
            description ??
            'This screen is part of the Sprint 1 plan and will be implemented in its epic. The app shell, routing, theme, API layer and mocks are already in place.'
          }
        />
      </Card>
    </>
  );
}
