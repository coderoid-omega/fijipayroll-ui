import { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const { Content } = Layout;

/** App shell: fixed Sider + sticky Topbar + routed content (CLAUDE.md §5). */
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} />
      <Layout>
        <Topbar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <Content style={{ padding: '24px 28px 56px', maxWidth: 1200, width: '100%' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
