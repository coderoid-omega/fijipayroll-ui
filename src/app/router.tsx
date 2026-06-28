import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RouteError } from './routes/RouteError';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { CompaniesListPage } from '@/features/companies/pages/CompaniesListPage';
import { PayElementsPage } from '@/features/pay-elements/pages/PayElementsPage';
import { TaxConfigPage } from '@/features/tax-config/pages/TaxConfigPage';
import { FnpfSchemePage } from '@/features/tax-config/pages/FnpfSchemePage';
import { PayCalendarPage } from '@/features/pay-calendar/pages/PayCalendarPage';
import { OrgLookupsPage } from '@/features/org-lookups/pages/OrgLookupsPage';
import { EmployeesListPage } from '@/features/employees/pages/EmployeesListPage';
import { EmployeeDetailPage } from '@/features/employees/pages/EmployeeDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Data router (React Router v6, CLAUDE.md §2). Public /login; everything else is behind
 * ProtectedRoute inside the AppLayout shell. (PlaceholderPage remains available for any future
 * not-yet-built area.)
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
          { path: 'employees', element: <EmployeesListPage /> },
          { path: 'employees/:id', element: <EmployeeDetailPage /> },
          { path: 'pay-elements', element: <PayElementsPage /> },
          { path: 'pay-calendar', element: <PayCalendarPage /> },
          { path: 'tax-config', element: <TaxConfigPage /> },
          { path: 'fnpf-schemes', element: <FnpfSchemePage /> },
          { path: 'org-lookups', element: <OrgLookupsPage /> },
          { path: '404', element: <NotFoundPage /> },
          { path: '*', element: <Navigate to="/404" replace /> },
        ],
      },
    ],
  },
]);
