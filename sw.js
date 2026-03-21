/**
 * Service Worker - Stale-while-revalidate con offline fallback
 */
const CACHE_NAME = 'rmvsfcb-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/data.js',
    './js/app.js',
    './js/charts.js',
    './js/animations.js',
    './js/tables.js',
    './assets/madrid-logo.svg',
    './assets/barca-logo.svg',
    './assets/icon.svg',
    './manifest.json'
];

// Install: pre-cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: stale-while-revalidate strategy
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests except CDN
    const url = new URL(event.request.url);
    const isSameOrigin = url.origin === location.origin;
    const isCDN = url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

    if (!isSameOrigin && !isCDN) return;

    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Offline fallback: return cached index for navigation requests
                        if (event.request.mode === 'navigate') {
                            return cache.match('./index.html');
                        }
                        return null;
                    });

                // Return cached version immediately, update in background
                return cachedResponse || fetchPromise;
            })
        )
    );
});
