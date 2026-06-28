import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { enableMocking } from './mocks';
import './styles/global.css';

// Start MSW (when enabled) BEFORE the app mounts so the first requests are intercepted.
void enableMocking().then(() => {
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element #root not found');
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
