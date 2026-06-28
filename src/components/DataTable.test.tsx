import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from './DataTable';

interface Row {
  id: string;
  name: string;
}

const columns = [{ title: 'Name', dataIndex: 'name', key: 'name' }];

describe('DataTable', () => {
  it('renders rows', () => {
    const data: Row[] = [
      { id: '1', name: 'Demo Company' },
      { id: '2', name: 'Sample Trading' },
    ];
    render(<DataTable<Row> columns={columns} data={data} />);
    expect(screen.getByText('Demo Company')).toBeInTheDocument();
    expect(screen.getByText('Sample Trading')).toBeInTheDocument();
  });

  it('shows the empty state when there are no rows', () => {
    render(<DataTable<Row> columns={columns} data={[]} emptyText="No companies yet" />);
    expect(screen.getByText('No companies yet')).toBeInTheDocument();
  });

  it('shows an error state with a retry handler', () => {
    const onRetry = vi.fn();
    render(
      <DataTable<Row>
        columns={columns}
        data={undefined}
        isError
        error={new Error('boom')}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Couldn't load this list")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
