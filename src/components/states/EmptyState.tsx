import { Empty } from 'antd';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  description?: ReactNode;
  action?: ReactNode;
}

/** Consistent empty state used by lists. */
export function EmptyState({ description = 'No records yet', action }: EmptyStateProps) {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description}>
      {action}
    </Empty>
  );
}
