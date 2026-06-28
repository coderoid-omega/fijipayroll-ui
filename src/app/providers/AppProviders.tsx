import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { TenantCompanyProvider } from './TenantCompanyProvider';

/**
 * Composition root for all app-wide providers. Order matters: Query wraps Auth (which uses
 * React Query for /me), Auth wraps TenantCompany (which reads me.companies). Theme is outermost
 * so AntD's static message/modal APIs are available everywhere.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <TenantCompanyProvider>{children}</TenantCompanyProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
