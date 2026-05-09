import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const SSR_ROUTES = new Set([
  '/', '/funzionalita', '/prezzi', '/sicurezza', '/come-funziona',
  '/contatti', '/privacy-policy', '/privacy', '/termini-condizioni',
  '/terms', '/cookie-policy', '/lancio',
]);

const rootEl = document.getElementById('root')!;
const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);

// Hydrate only on routes that were actually SSR-prerendered.
// dist/index.html carries data-ssr="true" (it's the prerendered home page)
// and Vercel uses it as the SPA fallback for every unknown route — so we must
// guard against hydrating on non-marketing routes like /gestione.
if (rootEl.hasAttribute('data-ssr') && SSR_ROUTES.has(window.location.pathname)) {
  hydrateRoot(rootEl, app);
} else {
  rootEl.removeAttribute('data-ssr');
  createRoot(rootEl).render(app);
}
