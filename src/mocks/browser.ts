import { setupWorker } from 'msw/browser';
import { handlersByResource } from './handlers';

/**
 * Resources that should hit the REAL API instead of the mock. Comma-separated, from
 * VITE_MSW_LIVE_RESOURCES (e.g. "auth"). A live resource's handlers are excluded from the worker,
 * so its requests fall through to the network (Vite proxies /api → the .NET API). This is the
 * per-route toggle that lets us integrate one epic at a time while the rest stay mocked.
 */
export const liveResources = new Set(
  (import.meta.env.VITE_MSW_LIVE_RESOURCES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

const activeHandlers = Object.entries(handlersByResource)
  .filter(([resource]) => !liveResources.has(resource))
  .flatMap(([, resourceHandlers]) => resourceHandlers);

/** The MSW worker for the browser. Started conditionally from `enableMocking` in main.tsx. */
export const worker = setupWorker(...activeHandlers);
