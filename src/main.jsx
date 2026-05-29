import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import router from './router/router.jsx'
import ThemeProvider from './provider/ThemeProvider.jsx'
import AuthProvider from './provider/AuthProvider.jsx'
import PlannerProvider from './provider/PlannerProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <PlannerProvider>
          <RouterProvider router={router} />
        </PlannerProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

// Register Service Worker in Production Mode (avoids caching conflicts during local development)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[Life OS] Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('[Life OS] Service Worker registration failed:', error);
      });
  });
}

// Capture the PWA install prompt globally to enable manual install triggers
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Prevent default automatic banner trigger
  window.deferredPrompt = e; // Store event globally
  window.dispatchEvent(new CustomEvent('pwa-install-available')); // Notify React components
});

// Hide the trigger once the app is successfully installed
window.addEventListener('appinstalled', () => {
  window.deferredPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});


