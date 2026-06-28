import type { ReactNode } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import en_GB from 'antd/locale/en_GB';
import { lightTheme } from '@/styles/theme';

/**
 * AntD theme + locale provider (CLAUDE.md §5). Uses en_GB locale (closest to en-FJ: DD/MM dates,
 * Monday-first weeks). `AntApp` enables the static message/modal/notification APIs app-wide.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={lightTheme} locale={en_GB}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
