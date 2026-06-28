import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RouteError } from './routes/RouteError';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Data router (React Router v6, CLAUDE.md §2). Public /login; everything else is behind
 * ProtectedRoute inside the AppLayout shell. Feature routes currently render PlaceholderPage and
 * are swapped for real screens per epic.
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteError />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: 'companies',
            element: <PlaceholderPage path="/companies" epic="Epic 2 — Company / Brand master (D11)" />,
          },
          {
            path: 'employees',
            element: <PlaceholderPage path="/employees" epic="Stretch / Sprint 2 — Employees" />,
          },
          {
            path: 'pay-elements',
            element: <PlaceholderPage path="/pay-elements" epic="Epic 3 — Pay Elements (codes + 14 groups)" />,
          },
          {
            path: 'pay-calendar',
            element: <PlaceholderPage path="/pay-calendar" epic="Epic 5 — Pay calendar & org lookups" />,
          },
          {
            path: 'tax-config',
            element: <PlaceholderPage path="/tax-config" epic="Epic 4 — Tax configuration (read-mostly)" />,
          },
          {
            path: 'fnpf-schemes',
            element: <PlaceholderPage path="/fnpf-schemes" epic="Epic 4 — FNPF scheme (read-mostly)" />,
          },
          {
            path: 'org-lookups',
            element: <PlaceholderPage path="/org-lookups" epic="Epic 5 — Departments / Offices / Occupations" />,
          },
          { path: '404', element: <NotFoundPage /> },
          { path: '*', element: <Navigate to="/404" replace /> },
        ],
      },
    ],
  },
]);
