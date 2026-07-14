import { useState } from 'react';
import { App as AntApp, Button, Card, Form, Input, Typography, theme } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { isApiError } from '@/lib/apiError';
import { zodRule } from '@/lib/zodForm';
import { loginSchema, type LoginFormValues } from '../schema';
import { brandColors } from '@/styles/theme';
import { APP_NAME } from '@/lib/constants';

interface LocationState {
  from?: { pathname: string };
}

/** Login (Epic 1) — wired to the real API. Seeded demo credentials shown in dev builds only. */
export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntApp.useApp();
  const { token } = theme.useToken();
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/';

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const onFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      await login(values.loginCode, values.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = isApiError(err) ? err.message : 'Login failed';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        // Brand-tinted gradient over the theme's layout background so it works in both modes.
        background: `linear-gradient(135deg, ${brandColors.primary}11, ${brandColors.teal}11)`,
        backgroundColor: token.colorBgLayout,
        padding: 16,
      }}
    >
      <Card style={{ width: 380, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              margin: '0 auto 12px',
              background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.teal})`,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 800,
            }}
          >
            FP
          </div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {APP_NAME}
          </Typography.Title>
          <Typography.Text type="secondary">Sign in to continue</Typography.Text>
        </div>

        <Form<LoginFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="loginCode"
            label="Login code"
            rules={[zodRule(loginSchema.shape.loginCode)]}
          >
            <Input prefix={<UserOutlined />} placeholder="e.g. ADMIN001" autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[zodRule(loginSchema.shape.password)]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              autoComplete="current-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Sign in
          </Button>
        </Form>

        {import.meta.env.DEV && (
          <Typography.Paragraph
            type="secondary"
            style={{ fontSize: 12, textAlign: 'center', marginTop: 16, marginBottom: 0 }}
          >
            Demo: <b>ADMIN001</b> / <b>password</b>
          </Typography.Paragraph>
        )}
      </Card>
    </div>
  );
}
