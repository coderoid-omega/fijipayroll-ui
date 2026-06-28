import { Button, InputNumber, Space, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

/** One editable bracket row. marginalRate is edited as a percentage for usability. */
export interface EditRow {
  key: string;
  lowerBound: number;
  upperBound: number | null;
  baseAmount: number;
  ratePct: number;
}

interface EditableBracketsTableProps {
  rows: EditRow[];
  onChange: (rows: EditRow[]) => void;
}

let rowSeq = 0;
function newEditRow(prev?: EditRow): EditRow {
  rowSeq += 1;
  return {
    key: `row-${rowSeq}`,
    lowerBound: prev?.upperBound ?? 0,
    upperBound: null,
    baseAmount: 0,
    ratePct: 0,
  };
}

/** Editable brackets grid for a single levy/taxType slice of a tax rule set. */
export function EditableBracketsTable({ rows, onChange }: EditableBracketsTableProps) {
  const update = (key: string, patch: Partial<EditRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const remove = (key: string) => onChange(rows.filter((r) => r.key !== key));

  const columns: ColumnsType<EditRow> = [
    {
      title: 'Lower bound',
      key: 'lower',
      width: 170,
      render: (_, row) => (
        <InputNumber
          min={0}
          step={1000}
          value={row.lowerBound}
          addonBefore="FJ$"
          style={{ width: '100%' }}
          onChange={(v) => update(row.key, { lowerBound: v ?? 0 })}
        />
      ),
    },
    {
      title: 'Upper bound',
      key: 'upper',
      width: 190,
      render: (_, row) => (
        <InputNumber
          min={0}
          step={1000}
          value={row.upperBound ?? undefined}
          addonBefore="FJ$"
          placeholder="∞ (open-ended)"
          style={{ width: '100%' }}
          onChange={(v) => update(row.key, { upperBound: v ?? null })}
        />
      ),
    },
    {
      title: 'Base tax',
      key: 'base',
      width: 160,
      render: (_, row) => (
        <InputNumber
          min={0}
          step={100}
          value={row.baseAmount}
          addonBefore="FJ$"
          style={{ width: '100%' }}
          onChange={(v) => update(row.key, { baseAmount: v ?? 0 })}
        />
      ),
    },
    {
      title: 'Marginal rate',
      key: 'rate',
      width: 130,
      render: (_, row) => (
        <InputNumber
          min={0}
          max={100}
          step={1}
          value={row.ratePct}
          addonAfter="%"
          style={{ width: '100%' }}
          onChange={(v) => update(row.key, { ratePct: v ?? 0 })}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, row) => (
        <Tooltip title="Remove bracket">
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(row.key)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      <Table<EditRow>
        rowKey="key"
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="small"
        locale={{ emptyText: 'No brackets — add one below.' }}
      />
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => onChange([...rows, newEditRow(rows[rows.length - 1])])}
        block
      >
        Add bracket
      </Button>
    </Space>
  );
}
