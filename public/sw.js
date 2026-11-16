// Brains & Taxes Enterprise Service Worker — v5 (Zero-FOUC & Chunk-Safe)
// ─────────────────────────────────────────────────────────────────────────────
// ARCHITECTURE SPECIFICATION (FCA & High-Scale Enterprise Standard):
//
// 1. NEVER cache HTML pages or navigation requests in CacheStorage.
//    Next.js generates content-hashed assets (CSS & JS) per build. Caching
//    HTML in a Service Worker creates stale-asset collisions (FOUC & Chunk 404s).
//    All HTML navigations MUST go straight to the network so browsers always
//    receive the exact matching CSS and JS chunks currently live on the server.
//
// 2. On activation, immediately PURGE ALL legacy caches ('bt-shell-*', 'bt-pwa-*').
//    This cleans up any broken or stale caches from previous builds in users' browsers.
//
// 3. Service Worker handles Web Push notifications & PWA installation seamlessly.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_NAME = 'bt-pwa-v5';

// Pre-cache only PWA manifest and icons for identity — NEVER HTML or dynamic chunks
const STATIC_PWA_ASSETS = [
  '/manifest.json',
  '/icon.svg',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PWA_ASSETS).catch((err) => {
        console.warn('[SW] Manifest pre-cache non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate — PURGE ALL old and stale cache versions ────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Purging stale legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch — Clean Network-First with Zero HTML Caching ────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cross-origin: standard browser network
  if (url.origin !== self.location.origin) return;

  // 1. Navigation requests (HTML pages): ALWAYS bypass Service Worker and go to network!
  //    This ensures users always receive the latest HTML with current CSS/JS hashes.
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    return; // Native browser fetch
  }

  // 2. Next.js static assets (_next/*) and APIs (/api/*): ALWAYS bypass SW
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) {
    return; // Native browser fetch
  }

  // 3. Static icons and manifest only — serve from cache if available
  if (url.pathname === '/manifest.json' || url.pathname === '/icon.svg' || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
  }
});

// ── Message handler — allow main thread to trigger cache purge ────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

// ── PUSH & NOTIFICATION HANDLERS ──────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'GPA & Co. Statutory Alert',
    body: 'Statutory compliance update received.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    url: '/'
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
