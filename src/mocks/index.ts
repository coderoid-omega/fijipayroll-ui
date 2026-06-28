/**
 * Conditionally start the Mock Service Worker. CLAUDE.md §6: the whole app runs on mocks today;
 * as each real endpoint lands, flip MSW off (per route or globally via VITE_ENABLE_MSW=false).
 */
export async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MSW !== 'true') return;

  const { worker } = await import('./browser');
  await worker.start({
    // Don't warn for requests we intentionally don't mock (assets, etc.).
    onUnhandledRequest: 'bypass',
    quiet: false,
  });
  // eslint-disable-next-line no-console
  console.info('[fiji-payroll] MSW mocking enabled — running without a backend.');
}
