/**
 * Single source of truth for the AntD theme (CLAUDE.md §5). Brand tokens match the prototypes
 * (../Prototypes/admin-configuration.html). Consumed by ConfigProvider in ThemeProvider.
 */
import { theme as antdTheme, type ThemeConfig } from 'antd';

export const brandColors = {
  primary: '#0a6ebd', // Fiji blue
  primaryDark: '#08538c',
  teal: '#12a594',
  success: '#1f9d57',
  warning: '#c97a16',
  error: '#d14343',
  ink: '#1a2330',
  ink2: '#48566a',
  line: '#e3e8ef',
  bg: '#f5f7fa',
} as const;

const sharedTokens: ThemeConfig['token'] = {
  colorPrimary: brandColors.primary,
  colorSuccess: brandColors.success,
  colorWarning: brandColors.warning,
  colorError: brandColors.error,
  colorInfo: brandColors.primary,
  borderRadius: 8,
  fontSize: 14,
  fontFamily:
    "'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif",
  // Tabular numerals for money columns (CLAUDE.md §5).
  fontFamilyCode: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
};

export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    ...sharedTokens,
    colorBgLayout: brandColors.bg,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 56,
      headerPadding: '0 20px',
      siderBg: '#ffffff',
      bodyBg: brandColors.bg,
    },
    Menu: {
      itemSelectedBg: '#e8f2fb',
      itemSelectedColor: brandColors.primaryDark,
      itemBorderRadius: 8,
    },
    Table: {
      headerBg: '#fafbfc',
      headerColor: brandColors.ink2,
      rowHoverBg: '#f5f9fd',
    },
    Card: {
      borderRadiusLG: 10,
    },
  },
};

/** Dark variant — wired up so the app is dark-mode-ready (Epic 0.3) even if off by default. */
export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: { ...sharedTokens },
  components: {
    Layout: { headerHeight: 56 },
  },
};
