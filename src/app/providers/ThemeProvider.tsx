import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import en_GB from 'antd/locale/en_GB';
import { darkTheme, lightTheme } from '@/styles/theme';
import { session } from '@/lib/session';
import { ThemeModeContext, type ThemeMode } from './ThemeModeContext';

function initialMode(): ThemeMode {
  const stored = session.getThemeMode();
  if (stored === 'light' || stored === 'dark') return stored;
  // First visit: follow the OS preference.
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * AntD theme + locale provider (CLAUDE.md §5). Uses en_GB locale (closest to en-FJ: DD/MM dates,
 * Monday-first weeks). `AntApp` enables the static message/modal/notification APIs app-wide.
 * Owns the light/dark mode: persisted per device, defaulting to the OS preference, toggled via
 * `useThemeMode()` (the Topbar switch).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    session.setThemeMode(mode);
    // Keep native UI (scrollbars, form controls) and the page behind AntD's Layout in sync.
    document.documentElement.style.colorScheme = mode;
    document.body.style.backgroundColor = mode === 'dark' ? '#000' : '';
  }, [mode]);

  const value = useMemo(
    () => ({ mode, toggleMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ConfigProvider theme={mode === 'dark' ? darkTheme : lightTheme} locale={en_GB}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </ThemeModeContext.Provider>
  );
}
