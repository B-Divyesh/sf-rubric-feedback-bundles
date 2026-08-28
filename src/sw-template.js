const CACHE = 'feedback-bundles-__CACHE_VERSION__';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(PRECACHE.map(async (url) => {
    const response = await fetch(new Request(url, { cache: 'no-store' }));
    if (!response.ok) throw new Error(`Could not precache ${url}`);
    await cache.put(url, response);
  }))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const pathname = new URL(event.request.url).pathname;
      const shellPath = pathname === '/' ? '/index.html' : pathname.endsWith('/') ? `${pathname}index.html` : pathname;
      const cached = await caches.match(shellPath, { ignoreVary: true });
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok) (await caches.open(CACHE)).put(event.request, response.clone());
        return response;
      } catch {
        return (await caches.match('/index.html', { ignoreVary: true })) || (await caches.match('/offline.html', { ignoreVary: true }));
      }
    })());
    return;
  }
  event.respondWith(caches.match(new URL(event.request.url).pathname, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
