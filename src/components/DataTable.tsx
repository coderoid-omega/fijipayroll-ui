import { Table } from 'antd';
import type { TablePaginationConfig, TableProps } from 'antd';
import type { ReactNode } from 'react';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { QueryError } from './states/QueryError';
import { EmptyState } from './states/EmptyState';

/** Server-side pagination state passed up to the caller's React Query hook. */
export interface ServerPagination {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

export interface DataTableProps<T> extends Omit<TableProps<T>, 'pagination' | 'dataSource'> {
  data: T[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Provide for server-side paging; omit for a simple non-paged table. */
  serverPagination?: ServerPagination;
  emptyText?: ReactNode;
  emptyAction?: ReactNode;
}

/**
 * Shared table wrapper over AntD Table (CLAUDE.md §5 — payroll is table-heavy, invest here):
 * server-side pagination, and consistent loading / empty / error states. Row selection, sort and
 * filter pass straight through via `...rest`.
 */
export function DataTable<T extends object>({
  data,
  isLoading,
  isError,
  error,
  onRetry,
  serverPagination,
  emptyText,
  emptyAction,
  rowKey = 'id',
  ...rest
}: DataTableProps<T>) {
  if (isError) {
    return <QueryError error={error} onRetry={onRetry} title="Couldn't load this list" />;
  }

  const pagination: TablePaginationConfig | false = serverPagination
    ? {
        current: serverPagination.page,
        pageSize: serverPagination.pageSize,
        total: serverPagination.total,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
        onChange: serverPagination.onChange,
      }
    : false;

  return (
    <Table<T>
      rowKey={rowKey}
      dataSource={data}
      loading={isLoading}
      pagination={pagination}
      locale={{
        emptyText: isLoading ? ' ' : <EmptyState description={emptyText} action={emptyAction} />,
      }}
      scroll={{ x: 'max-content' }}
      {...rest}
    />
  );
}
