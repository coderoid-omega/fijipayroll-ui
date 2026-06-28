import { useMemo } from 'react';
import { Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { navGroups } from './navConfig';
import { brandColors } from '@/styles/theme';
import { APP_NAME } from '@/lib/constants';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

/** Fixed left navigation, grouped by domain (CLAUDE.md §5). */
export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const items: MenuProps['items'] = useMemo(
    () =>
      navGroups.map((group) => ({
        key: group.key,
        type: 'group',
        label: group.label,
        children: group.items.map((item) => ({
          key: item.path,
          icon: item.icon,
          label: item.label,
        })),
      })),
    [],
  );

  // Highlight the longest matching path so nested routes keep their parent active.
  const selectedKey = useMemo(() => {
    const paths = navGroups.flatMap((g) => g.items.map((i) => i.path));
    const matches = paths
      .filter((p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)))
      .sort((a, b) => b.length - a.length);
    return matches[0] ?? '/';
  }, [location.pathname]);

  return (
    <Sider
      width={248}
      collapsible
      collapsed={collapsed}
      trigger={null}
      theme="light"
      style={{ borderRight: `1px solid ${brandColors.line}` }}
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          borderBottom: `1px solid ${brandColors.line}`,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.teal})`,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          FP
        </div>
        {!collapsed && (
          <Typography.Text strong style={{ fontSize: 15 }}>
            {APP_NAME}
          </Typography.Text>
        )}
      </div>
      <Menu
        mode="inline"
        items={items}
        selectedKeys={[selectedKey]}
        style={{ borderInlineEnd: 'none', paddingTop: 8 }}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
}
