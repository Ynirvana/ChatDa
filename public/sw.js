// ChatDa Service Worker
// Hand-written (no next-pwa/workbox) — safe under Next.js 16 turbopack.
// Update CACHE_VERSION to force a full cache purge on next activation.

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `chatda-static-${CACHE_VERSION}`;
const PAGES_CACHE = `chatda-pages-${CACHE_VERSION}`;

const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/manifest.json'];

// ── Kill switch: visit any page with ?kill-sw=1 to unregister + clear caches ──
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function shouldBypass(url, request) {
  // Non-GET never cached
  if (request.method !== 'GET') return true;
  // Cross-origin: let the browser handle it
  if (url.origin !== self.location.origin) return true;
  // NextAuth + any API route — session-sensitive, never cache
  if (url.pathname.startsWith('/api/')) return true;
  // Admin area
  if (url.pathname.startsWith('/admin')) return true;
  // Server actions / RSC payloads
  if (url.searchParams.has('_rsc')) return true;
  return false;
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/manifest.json' ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|css|js)$/.test(url.pathname)
  );
}

function isHTMLRequest(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (shouldBypass(url, request)) return;

  // HTML pages → network-first (so deploys propagate immediately)
  if (isHTMLRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return offline || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Static assets → cache-first (Next hashes filenames, so content-addressed)
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          return new Response('Offline', { status: 503 });
        }
      })()
    );
  }
});
