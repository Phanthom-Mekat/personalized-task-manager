const CACHE_NAME = 'lifeos-core-cache-v1';

// Static assets to cache immediately upon installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/logo-maskable.svg',
  '/manifest.json'
];

// 1. Install event: Cache the initial core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching Core Shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Force the waiting service worker to become active
  );
});

// 2. Activate event: Clear legacy caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing Legacy Cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim all clients immediately
  );
});

// 3. Fetch event: Dynamically intercept and cache static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // STAGE 1: Check strict bypasses (Do NOT cache API, Socket, or Firebase Auth/Firestore traffic)
  const isApiRequest = url.pathname.startsWith('/api') || url.hostname.includes('localhost:5000') || url.hostname.includes('vercel.app');
  const isFirebaseRequest = url.hostname.includes('firebase') || url.hostname.includes('googleapis');
  const isSocketRequest = url.pathname.startsWith('/socket.io');

  if (isApiRequest || isFirebaseRequest || isSocketRequest || event.request.method !== 'GET') {
    // Pass straight to the network without caching
    return;
  }

  // STAGE 2: Handle SPA navigation fallback
  // For page refreshes on subroutes (e.g. /planner/growth), serve index.html from cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If offline or network fails, return cached index.html
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // STAGE 3: Handle static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Stale-While-Revalidate: Serve cached copy instantly, fetch update in background
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {
              /* Ignore background refresh errors when offline */
            });

          return cachedResponse;
        }

        // Cache miss: fetch from network, cache for next time, and return response
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
  );
});

// 4. Notification Click event: Intercept background "quick-ping" actions and hit API silently
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  
  if (action === 'quick-ping') {
    const { userId, contactId, apiUrl } = notification.data;
    const baseUrl = apiUrl || ''; // Dynamically use the origin passed from the main application thread
    
    // Background fetch to silently log interaction and restore vitality
    event.waitUntil(
      fetch(`${baseUrl}/api/contacts/${userId}/${contactId}/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: 'Recharged silently from lock-screen notification.' })
      })
      .then(() => {
        console.log('[Service Worker] Silently recharged contact:', contactId);
        notification.close();
      })
      .catch((err) => {
        console.error('[Service Worker] Silent recharge failed:', err);
        notification.close();
      })
    );
  } else {
    // Standard notification click opens the CRM application page
    notification.close();
    event.waitUntil(
      clients.openWindow('/planner/social')
    );
  }
});
