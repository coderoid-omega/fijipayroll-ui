/**
 * Conditionally start the Mock Service Worker. CLAUDE.md §6: the app runs on mocks, and as each
 * real endpoint lands we flip that resource to the real API via VITE_MSW_LIVE_RESOURCES (per-route
 * toggle) — or turn the whole layer off with VITE_ENABLE_MSW=false.
 */
export async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MSW !== 'true') return;

  const { worker, liveResources } = await import('./browser');
  await worker.start({
    // Live resources (and assets) are intentionally unmocked — let them reach the network/proxy.
    onUnhandledRequest: 'bypass',
    quiet: false,
  });

  const live = liveResources.size ? [...liveResources].join(', ') : 'none';
  // eslint-disable-next-line no-console
  console.info(`[fiji-payroll] MSW enabled — mocking all resources except live: [${live}].`);
}
