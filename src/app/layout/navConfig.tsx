import type { ReactNode } from 'react';
import {
  ApartmentOutlined,
  BankOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DollarOutlined,
  PercentageOutlined,
  TeamOutlined,
} from '@ant-design/icons';

export interface NavItem {
  key: string;
  /** Route path. */
  path: string;
  label: string;
  icon?: ReactNode;
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

/**
 * Sidebar navigation, grouped by domain (CLAUDE.md §5). The same config drives breadcrumbs.
 * Routes that are later-sprint features still appear so the shell is fully navigable.
 */
export const navGroups: NavGroup[] = [
  {
    key: 'overview',
    label: 'Overview',
    items: [{ key: 'dashboard', path: '/', label: 'Dashboard', icon: <DashboardOutlined /> }],
  },
  {
    key: 'organisation',
    label: 'Organisation',
    items: [
      { key: 'companies', path: '/companies', label: 'Companies', icon: <BankOutlined /> },
      { key: 'employees', path: '/employees', label: 'Employees', icon: <TeamOutlined /> },
    ],
  },
  {
    key: 'payroll-setup',
    label: 'Payroll Setup',
    items: [
      { key: 'pay-elements', path: '/pay-elements', label: 'Pay Elements', icon: <DollarOutlined /> },
      { key: 'pay-calendar', path: '/pay-calendar', label: 'Pay Calendar', icon: <CalendarOutlined /> },
    ],
  },
  {
    key: 'statutory',
    label: 'Statutory',
    items: [
      { key: 'tax-config', path: '/tax-config', label: 'Tax Configuration', icon: <PercentageOutlined /> },
      { key: 'fnpf', path: '/fnpf-schemes', label: 'FNPF Scheme', icon: <PercentageOutlined /> },
    ],
  },
  {
    key: 'lookups',
    label: 'Org Lookups',
    items: [
      { key: 'org-lookups', path: '/org-lookups', label: 'Org Lookups', icon: <ApartmentOutlined /> },
    ],
  },
];

/** Flat lookup of path -> label for breadcrumbs. */
export const navLabelByPath: Record<string, string> = Object.fromEntries(
  navGroups.flatMap((g) => g.items.map((i) => [i.path, i.label])),
);
