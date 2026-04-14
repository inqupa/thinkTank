const CACHE_NAME = 'vent-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/skin/base.css',
    '/skin/auth_style_placeholder.css',
    '/skin/problem_style_placeholder.css',
    '/skin/profile_style_placeholder.css',
    '/subsystems/state/state.js',
    '/subsystems/db.js',
    '/subsystems/router.js',
    '/skeleton/auth_placeholder.html',
    '/skeleton/problem_placeholder.html',
    '/skeleton/profile_placeholder.html'
];

// Phase 3.4: Install event - Save files to the device disk
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Phase 3.4: Caching Core Assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Cleanup event - Remove old versions of the site
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
});

// Intercept requests - Serve from cache first, then network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});