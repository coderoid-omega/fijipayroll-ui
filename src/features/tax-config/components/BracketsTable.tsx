import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { formatMoney, formatRate } from '@/lib/money';
import { EmptyState } from '@/components';
import type { TaxBracket } from '@/types/api';

function bandLabel(b: TaxBracket): string {
  const lower = formatMoney(b.lowerBound);
  if (b.upperBound === null || b.upperBound === undefined) return `Over ${lower}`;
  return `${lower} – ${formatMoney(b.upperBound)}`;
}

/** Read-only brackets table for one levy/taxType slice of a tax rule set. */
export function BracketsTable({ brackets }: { brackets: TaxBracket[] }) {
  const sorted = [...brackets].sort((a, b) => a.ordinal - b.ordinal);

  const columns: ColumnsType<TaxBracket> = [
    {
      title: 'Chargeable income band',
      key: 'band',
      render: (_: unknown, row) => bandLabel(row),
    },
    {
      title: 'Base tax',
      dataIndex: 'baseAmount',
      key: 'base',
      align: 'right',
      width: 160,
      render: (v: number) => <span className="num">{formatMoney(v)}</span>,
    },
    {
      title: 'Marginal rate',
      dataIndex: 'marginalRate',
      key: 'rate',
      align: 'right',
      width: 140,
      render: (v: number) => <span className="num">{formatRate(v)}</span>,
    },
  ];

  if (sorted.length === 0) {
    return <EmptyState description="No brackets defined for this levy." />;
  }

  return (
    <Table<TaxBracket>
      rowKey={(r) => `${r.levy}-${r.taxType}-${r.ordinal}`}
      columns={columns}
      dataSource={sorted}
      pagination={false}
      size="middle"
    />
  );
}
