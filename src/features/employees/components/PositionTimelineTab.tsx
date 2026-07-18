import { Card, Flex, Table, Tag, Typography } from 'antd';
import { formatDate } from '@/lib/date';
import type { Employee, PositionAxis, PositionTimelineEntry } from '@/types/api';
import { usePositionHistory } from '../api/hooks';

interface PositionTimelineTabProps {
  companyId: string;
  employee: Employee;
}

const AXIS_META: Record<PositionAxis, { label: string; color: string }> = {
  PLACEMENT: { label: 'Where you sit', color: 'geekblue' },
  JOB: { label: 'What you are', color: 'purple' },
  RATE: { label: "What you're paid", color: 'gold' },
};

/**
 * The Position Timeline tab (Sprint 2 Epic 6): the merged view (§8.5) over the three axes —
 * placement (transfer, Epic 8), job (regrade) and rate (rate-change) — newest first. A promotion
 * shows as TWO entries (JOB + RATE) on one date, which is honest: they were two actions, each
 * audited separately. Read-only; the write actions live on the Employment tab.
 */
export function PositionTimelineTab({ companyId, employee }: PositionTimelineTabProps) {
  const timeline = usePositionHistory(companyId, employee.id);

  return (
    <Flex vertical gap={16}>
      <Card size="small" title="Position timeline">
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Three axes, one action each — each row states all of its own fields, so backdating is
          safe: a backdated change never disturbs a later one. The current values shown elsewhere
          are resolved as-of today from this timeline.
        </Typography.Paragraph>
        <Table<PositionTimelineEntry>
          size="small"
          rowKey={(r) => `${r.axis}-${r.validFrom}-${r.changeType}`}
          loading={timeline.isLoading}
          dataSource={timeline.data ?? []}
          pagination={false}
          columns={[
            { title: 'Effective', dataIndex: 'validFrom', render: (v: string) => formatDate(v) },
            {
              title: 'Axis',
              dataIndex: 'axis',
              render: (v: PositionAxis) => <Tag color={AXIS_META[v].color}>{AXIS_META[v].label}</Tag>,
            },
            { title: 'Change', dataIndex: 'changeType' },
            { title: 'Reason', dataIndex: 'reason', render: (v: string | null) => v ?? '—' },
            { title: 'By', dataIndex: 'createdBy' },
          ]}
        />
      </Card>
    </Flex>
  );
}
