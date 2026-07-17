import { useMemo, useState } from 'react';
import { Button, Card, Flex, Table, Tag, Typography } from 'antd';
import { formatDate } from '@/lib/date';
import type {
  ContractTerm,
  ContractTypeHistoryEntry,
  Employee,
  Engagement,
  StageHistoryEntry,
  SuspensionHistoryEntry,
} from '@/types/api';
import {
  useContractTerms,
  useContractTypeHistory,
  useContractTypeOptions,
  useEmploymentStageOptions,
  useEngagements,
  useStageHistory,
  useSuspensionHistory,
} from '../api/hooks';
import { ContractTermModal } from './LifecycleActionModals';

interface StageHistoryTabProps {
  companyId: string;
  employee: Employee;
}

const dash = (v: string | null | undefined) => (v ? formatDate(v) : '—');

/**
 * The Stage & History tab (Sprint 2 Epic 4): the engagement timeline and the three history
 * lists under it. All of it is BUSINESS history (what the engine reads) — the audit trail
 * (who edited what) is a separate Epic-11 surface. Read-only here except term renewal;
 * the write actions live on the Employment tab.
 */
export function StageHistoryTab({ companyId, employee }: StageHistoryTabProps) {
  const engagements = useEngagements(companyId, employee.id);
  const stageHistory = useStageHistory(companyId, employee.id);
  const contractTypeHistory = useContractTypeHistory(companyId, employee.id);
  const contractTerms = useContractTerms(companyId, employee.id);
  const suspensionHistory = useSuspensionHistory(companyId, employee.id);
  const stages = useEmploymentStageOptions();
  const contractTypes = useContractTypeOptions();
  const [renewing, setRenewing] = useState<ContractTerm | null>(null);

  const stageName = useMemo(() => {
    const map = new Map((stages.data ?? []).map((s) => [s.id, s.name]));
    return (id: string | null | undefined) => (id ? (map.get(id) ?? id) : '—');
  }, [stages.data]);

  const typeName = useMemo(() => {
    const map = new Map((contractTypes.data ?? []).map((c) => [c.id, c.name]));
    return (id: string | null | undefined) => (id ? (map.get(id) ?? id) : '—');
  }, [contractTypes.data]);

  return (
    <Flex vertical gap={16}>
      <Card size="small" title="Engagements (hire → terminate cycles)">
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          The current engagement is authoritative for contract type, continuous service and hire
          date; a rehire (Epic 5) opens a new cycle rather than editing this one.
        </Typography.Paragraph>
        <Table<Engagement>
          size="small"
          rowKey="id"
          loading={engagements.isLoading}
          dataSource={engagements.data ?? []}
          pagination={false}
          columns={[
            {
              title: 'Current',
              dataIndex: 'isCurrent',
              render: (v: boolean) => (v ? <Tag color="green">Current</Tag> : <Tag>Prior</Tag>),
            },
            { title: 'Employee code', dataIndex: 'employeeCode' },
            { title: 'Hired', dataIndex: 'dateOfHire', render: dash },
            { title: 'Continuous service', dataIndex: 'continuousServiceDate', render: dash },
            { title: 'Contract type', dataIndex: 'contractTypeId', render: (v: string) => typeName(v) },
            { title: 'Terminated', dataIndex: 'terminationEffectiveDate', render: dash },
          ]}
        />
      </Card>

      <Card size="small" title="Stage history">
        <Table<StageHistoryEntry>
          size="small"
          rowKey="id"
          loading={stageHistory.isLoading}
          dataSource={stageHistory.data ?? []}
          pagination={false}
          columns={[
            { title: 'Effective', dataIndex: 'effectiveDate', render: dash },
            { title: 'From', dataIndex: 'fromStageId', render: (v: string | null) => stageName(v) },
            {
              title: 'To',
              dataIndex: 'toStageId',
              render: (v: string, row) => (
                <>
                  {stageName(v)}{' '}
                  {row.fromStageId === row.toStageId && <Tag color="orange">probation extended</Tag>}
                </>
              ),
            },
            { title: 'Reason', dataIndex: 'reason', render: (v: string | null) => v ?? '—' },
            { title: 'Review ref', dataIndex: 'reviewRef', render: (v: string | null) => v ?? '—' },
          ]}
        />
      </Card>

      <Card size="small" title="Contract-type history">
        <Table<ContractTypeHistoryEntry>
          size="small"
          rowKey="id"
          loading={contractTypeHistory.isLoading}
          dataSource={contractTypeHistory.data ?? []}
          pagination={false}
          columns={[
            { title: 'Valid from', dataIndex: 'validFrom', render: dash },
            {
              title: 'From',
              dataIndex: 'fromContractTypeId',
              render: (v: string | null) => (v ? typeName(v) : <Tag>hire</Tag>),
            },
            { title: 'To', dataIndex: 'toContractTypeId', render: (v: string) => typeName(v) },
            { title: 'Reason', dataIndex: 'reason', render: (v: string | null) => v ?? '—' },
          ]}
        />
      </Card>

      <Card size="small" title="Suspension history">
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Suspension is recorded as <b>windows</b> (an interval, not an event) — unpaid windows
          are payroll-affecting once the engine lands. An open window has no end date.
        </Typography.Paragraph>
        <Table<SuspensionHistoryEntry>
          size="small"
          rowKey="id"
          loading={suspensionHistory.isLoading}
          dataSource={suspensionHistory.data ?? []}
          pagination={false}
          columns={[
            { title: 'From', dataIndex: 'startDate', render: dash },
            {
              title: 'To',
              dataIndex: 'endDate',
              render: (v: string | null) => (v ? formatDate(v) : <Tag color="orange">open</Tag>),
            },
            {
              title: 'Paid',
              dataIndex: 'isPaid',
              render: (v: boolean) =>
                v ? <Tag>Paid</Tag> : <Tag color="red">Unpaid — payroll-affecting</Tag>,
            },
            { title: 'Reason', dataIndex: 'reason' },
            { title: 'Lifted', dataIndex: 'liftedReason', render: (v: string | null) => v ?? '—' },
          ]}
        />
      </Card>

      <Card size="small" title="Contract terms">
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          A renewal is recorded as a <b>new</b> term linked to the one it renews — never an
          overwrite.
        </Typography.Paragraph>
        <Table<ContractTerm>
          size="small"
          rowKey="id"
          loading={contractTerms.isLoading}
          dataSource={contractTerms.data ?? []}
          pagination={false}
          columns={[
            { title: 'Start', dataIndex: 'termStart', render: dash },
            { title: 'End', dataIndex: 'termEnd', render: dash },
            { title: 'Signed', dataIndex: 'signedDate', render: dash },
            {
              title: 'Renews',
              dataIndex: 'renewalOf',
              render: (v: string | null) => (v ? <Tag color="blue">renewal</Tag> : '—'),
            },
            {
              title: '',
              key: 'actions',
              render: (_, row) => (
                <Button size="small" onClick={() => setRenewing(row)}>
                  Renew
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <ContractTermModal
        open={renewing !== null}
        companyId={companyId}
        employee={employee}
        renewalOf={renewing}
        onClose={() => setRenewing(null)}
      />
    </Flex>
  );
}
