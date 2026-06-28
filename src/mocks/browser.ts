import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/** The MSW worker for the browser. Started conditionally from `enableMocking` in main.tsx. */
export const worker = setupWorker(...handlers);
