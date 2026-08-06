// service-worker.js — Pata Hai? PWA

// On localhost: self-unregister so the SW never blocks local dev
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', () => {
    self.registration.unregister();
    self.clients.matchAll().then(clients => clients.forEach(c => c.navigate(c.url)));
  });
} else {

const SHELL_CACHE = 'pata-hai-shell-v5';
const DATA_CACHE  = `pata-hai-data-${new Date().toLocaleDateString('en-CA')}`;

const SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ── Install: cache app shell ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: evict old shell and data caches ─────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k =>
            (k.startsWith('pata-hai-data-') && k !== DATA_CACHE) ||
            (k.startsWith('pata-hai-shell-') && k !== SHELL_CACHE)
          )
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: shell = cache-first, data = network-first ─────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Local dev: never cache local-daily JSON — always fetch fresh from network
  const isLocalData = (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
                      url.pathname.includes('/local-daily/');
  if (isLocalData) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isGCSData = url.hostname === 'storage.googleapis.com' &&
                    url.pathname.includes('/pata-hai-daily/daily/');

  if (isGCSData) {
    // Network-first: always try fresh daily JSON, fall back to cache
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(DATA_CACHE).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Network-first: app shell files — ensures updated app.js/style.css always deploy
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

} // end else (non-localhost)
