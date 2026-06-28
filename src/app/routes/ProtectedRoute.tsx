import { Spin } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';

/**
 * Route guard: redirect unauthenticated users to /login (preserving the attempted location), and
 * show a full-page spinner while /me is loading so the shell never flashes empty.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="Loading…" />
      </div>
    );
  }

  return <Outlet />;
}
