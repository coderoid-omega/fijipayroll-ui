import { Avatar, Button, Dropdown, Layout, Space, Tooltip, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/app/providers/AuthContext';
import { useTenantCompany } from '@/app/providers/TenantCompanyContext';
import { useThemeMode } from '@/app/providers/ThemeModeContext';
import { initials } from '@/lib/format';
import { brandColors } from '@/styles/theme';
import { CompanySwitcher } from './CompanySwitcher';

const { Header } = Layout;

interface TopbarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Topbar: nav toggle, company switcher (D11), theme switch, tenant label, user menu. */
export function Topbar({ collapsed, onToggle }: TopbarProps) {
  const { me, logout } = useAuth();
  const { tenant } = useTenantCompany();
  const { mode, toggleMode } = useThemeMode();
  const { token } = theme.useToken();

  const userMenu: MenuProps['items'] = [
    { key: 'tenant', label: tenant?.name ?? '—', disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', onClick: logout },
  ];

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderBottom: `1px solid ${token.colorSplit}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Button
        type="text"
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
      />
      <CompanySwitcher />
      <div style={{ flex: 1 }} />
      <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        <Button
          type="text"
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleMode}
        />
      </Tooltip>
      <Dropdown menu={{ items: userMenu }} trigger={['click']}>
        <Space style={{ cursor: 'pointer' }}>
          <Avatar size="small" style={{ background: brandColors.primary }}>
            {initials(me?.displayName)}
          </Avatar>
          <Typography.Text>{me?.displayName ?? <UserOutlined />}</Typography.Text>
        </Space>
      </Dropdown>
    </Header>
  );
}
