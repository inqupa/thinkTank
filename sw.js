const CACHE_NAME = 'vent-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/config/manifest.json',
    '/index.html',
    '/skin/theme.css',
    '/skin/base.css',
    '/skin/auth_style_placeholder.css',
    '/skin/problem_style_placeholder.css',
    '/skin/profile_style_placeholder.css',
    '/subsystems/bootloader/bootloader.js',
    '/subsystems/logic/nav-bar.js',
    '/subsystems/logic/user-card.js',
    '/subsystems/state/state.js',
    '/subsystems/db.js',
    '/skeleton/auth_placeholder.html',
    '/skeleton/problem_placeholder.html',
    '/skeleton/profile_placeholder.html'
];
const VERSION_CHECK_URL = '/config/version.json';

self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') self.skipWaiting();
});

// Logic to periodically check for version updates
async function checkForUpdates() {
    try {
        const response = await fetch(VERSION_CHECK_URL);
        const data = await response.json();
        const currentVersion = await caches.match('version');
        
        if (currentVersion && (await currentVersion.json()).version !== data.version) {
            console.log("Phase 4.3: New Version Detected. Purging Cache...");
            await caches.delete(CACHE_NAME);
            // Trigger a re-install of the new version
        }
    } catch (e) {
        console.warn("Version check skipped (offline).");
    }
}

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