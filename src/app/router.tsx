import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RouteError } from './routes/RouteError';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { CompaniesListPage } from '@/features/companies/pages/CompaniesListPage';
import { PayElementsPage } from '@/features/pay-elements/pages/PayElementsPage';
import { TaxConfigPage } from '@/features/tax-config/pages/TaxConfigPage';
import { FnpfSchemePage } from '@/features/tax-config/pages/FnpfSchemePage';
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
          { path: 'companies', element: <CompaniesListPage /> },
          {
            path: 'employees',
            element: <PlaceholderPage path="/employees" epic="Stretch / Sprint 2 — Employees" />,
          },
          { path: 'pay-elements', element: <PayElementsPage /> },
          {
            path: 'pay-calendar',
            element: <PlaceholderPage path="/pay-calendar" epic="Epic 5 — Pay calendar & org lookups" />,
          },
          { path: 'tax-config', element: <TaxConfigPage /> },
          { path: 'fnpf-schemes', element: <FnpfSchemePage /> },
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
