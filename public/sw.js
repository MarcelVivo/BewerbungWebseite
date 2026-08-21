const VERSION = 'ms-pwa-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = '/offline';
const MAX_CACHE_BYTES = 4 * 1024 * 1024;
const PRECACHE = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/pwa/icon-maskable-512.png',
  '/pwa/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => (self.registration.active ? undefined : self.skipWaiting())),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('ms-pwa-') && !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function isPrivateOrDynamic(url) {
  return url.pathname.startsWith('/api/')
    || url.pathname.startsWith('/dashboard')
    || url.pathname.startsWith('/auth')
    || url.pathname.startsWith('/login')
    || url.pathname.startsWith('/recruiter');
}

function isHeavyMedia(request, url) {
  return request.destination === 'video'
    || request.headers.has('range')
    || url.pathname.startsWith('/cinematic/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivateOrDynamic(url) || isHeavyMedia(request, url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (
          (await caches.match(request, { ignoreSearch: true }))
          || (await caches.match(OFFLINE_URL))
          || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        )),
    );
    return;
  }

  const cacheableAsset = url.pathname.startsWith('/_next/static/')
    || ['style', 'script', 'font', 'image'].includes(request.destination);
  if (!cacheableAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const update = fetch(request).then((response) => {
        const contentLength = Number(response.headers.get('content-length') || 0);
        const sizeIsSafe = contentLength === 0 || contentLength <= MAX_CACHE_BYTES;
        if (response.ok && response.type === 'basic' && sizeIsSafe) {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached || new Response('', { status: 504, statusText: 'Offline' }));
      return cached || update;
    }),
  );
});
