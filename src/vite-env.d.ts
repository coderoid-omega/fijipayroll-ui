/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** "true" to enable the MSW mock layer. */
  readonly VITE_ENABLE_MSW: string;
  /** Comma-separated resources to serve from the real API instead of mocks (e.g. "auth"). */
  readonly VITE_MSW_LIVE_RESOURCES?: string;
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
