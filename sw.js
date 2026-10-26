const BUILD = '20261026110509922';
const PRECACHE = ["./components/button.js","./components/checkbox.js","./components/input.js","./components/modal.js","./components/pill.js","./components/playground.js","./components/popover.js","./components/registry.js","./components/select.js","./components/switch.js","./components/table.js","./components/tabs.js","./components/tag.js","./components/toast.js","./components/tooltip.js","./css/app.css","./css/components/button.css","./css/components/checkbox.css","./css/components/input.css","./css/components/modal.css","./css/components/pill.css","./css/components/playground.css","./css/components/popover.css","./css/components/select.css","./css/components/switch.css","./css/components/table.css","./css/components/tabs.css","./css/components/tag.css","./css/components/toast.css","./css/components/tooltip.css","./css/tokens.css","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./index.html","./js/app.js","./js/build-info.js","./js/i18n.js","./js/icons.js","./js/pwa.js","./js/router.js","./manifest.webmanifest","./tokens/tokens.json","./version.json"];
const CACHE_PREFIX = `ds-admin-${new URL(self.registration.scope).pathname}-`;
const CACHE = `${CACHE_PREFIX}${BUILD}`;
const shellURL = new URL('./index.html', self.registration.scope).href;
const assetURLs = new Set(PRECACHE.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'GET_BUILD') event.ports[0]?.postMessage({ build: BUILD });
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request)) || (await cache.match(shellURL)) || Response.error();
      }
    })());
    return;
  }
  const assetURL = new URL(url);
  assetURL.search = '';
  if (!assetURLs.has(assetURL.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request) || await cache.match(assetURL.href);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
