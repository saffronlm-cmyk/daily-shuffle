// Daily Shuffle — Service Worker
// Network-first for the HTML document (so a new deploy shows up on the next
// open, no double hard-refresh needed), cache-first for static assets so the
// app still loads instantly and works offline.

const CACHE = 'daily-shuffle-v47';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: pre-cache all app assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = req.url;

  // Always network for API calls (never cache dynamic data)
  if (url.includes('api.anthropic.com') || url.includes('supabase.co') || url.includes('edamam.com')) {
    event.respondWith(fetch(req));
    return;
  }

  // Network-first for the HTML document. When online the freshest index.html
  // wins (so deploys appear on the next open); when offline we fall back to the
  // cached copy. This is the fix for stale-HTML-after-deploy.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for everything else (icons, manifest) — instant + offline.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (req.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(req, clone));
        }
        return response;
      });
    })
  );
});
