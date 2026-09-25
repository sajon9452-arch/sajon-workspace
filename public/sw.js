// Service Worker for সিলেট মানব সেবা সংগঠন PWA
// Provides comprehensive offline caching for member records, member photos, static assets, and app shell

const APP_CACHE_NAME = 'pms-app-cache-v4';
const PHOTO_CACHE_NAME = 'pms-member-photos-v2';
const API_CACHE_NAME = 'pms-api-cache-v2';

const ALL_CACHES = [APP_CACHE_NAME, PHOTO_CACHE_NAME, API_CACHE_NAME];

// Core App Shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event: Pre-cache App Shell and core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Service Worker] Some precache assets failed to load:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!ALL_CACHES.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Intelligent multi-layer cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests, dev tools, and dev hot-reloads
  if (
    request.method !== 'GET' ||
    url.protocol.startsWith('chrome-extension') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('hot-update') ||
    url.search.includes('v=') ||
    url.search.includes('t=')
  ) {
    return;
  }

  // 1. MEMBER PHOTO ENDPOINTS (/api/member-photo/*): Cache-First for instant 0ms rendering
  if (url.pathname.startsWith('/api/member-photo/')) {
    event.respondWith(
      caches.open(PHOTO_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch (fetchErr) {
          // If offline and not in cache, return an empty 404 image response
          return new Response(null, { status: 404, statusText: 'Offline Photo Unavailable' });
        }
      })
    );
    return;
  }

  // 2. BACKEND DATA API (/api/data): Network-First -> Cache Fallback for offline persistence
  if (url.pathname === '/api/data') {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch (netErr) {
          // Network failure / Offline: serve last known cached database snapshot
          const cached = await cache.match(request);
          if (cached) {
            console.log('[Service Worker] Serving cached /api/data in offline mode');
            return cached;
          }
          // Ultimate safe offline JSON fallback
          return new Response(
            JSON.stringify({ success: true, offline: true, data: { members: [] } }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
      })
    );
    return;
  }

  // 3. HEALTH CHECK (/api/health): Network-First with offline status fallback
  if (url.pathname === '/api/health') {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ status: 'ok', offline: true, serverTime: new Date().toISOString() }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Skip any other /api/ write endpoints (like POST/DELETE)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 4. NAVIGATION REQUESTS (HTML Pages): Network First -> Fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(APP_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[Service Worker] Offline navigation: serving cached app shell');
          const cache = await caches.open(APP_CACHE_NAME);
          const cachedResponse = await cache.match(request) || await cache.match('/index.html') || await cache.match('/');
          return cachedResponse || new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>সিলেট মানব সেবা সংগঠন (অফলাইন)</title></head><body><div id="root"></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 5. GOOGLE FONTS & STATIC CDNs: Cache First -> Network Fallback
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(APP_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response('', { status: 408, statusText: 'Offline Font Request Failed' });
        });
      })
    );
    return;
  }

  // 6. STATIC ASSETS (.js, .css, images, icons, fonts): Stale-While-Revalidate
  const isStaticAsset = 
    url.pathname.endsWith('.js') || 
    url.pathname.endsWith('.css') || 
    url.pathname.endsWith('.svg') || 
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.jpg') || 
    url.pathname.endsWith('.jpeg') || 
    url.pathname.endsWith('.webp') || 
    url.pathname.endsWith('.woff') || 
    url.pathname.endsWith('.woff2') || 
    url.pathname.includes('/assets/');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(APP_CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 7. DEFAULT: Network First -> Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(APP_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// Messages from app (e.g. skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      return Promise.all(names.map((n) => caches.delete(n)));
    });
  }
});
