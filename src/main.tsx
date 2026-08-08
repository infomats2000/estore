import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminInteractionProvider } from './context/AdminInteractionContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AdminInteractionProvider>
        <App />
      </AdminInteractionProvider>
    </ErrorBoundary>
  </StrictMode>,
);


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((reg) => {
      void reg.update();
      console.log('[Offline PWA] Service Worker registered successfully:', reg.scope);
    }).catch((err) => {
      console.warn('[Offline PWA] Service Worker registration failed:', err);
    });
  });
}
