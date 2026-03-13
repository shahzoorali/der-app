// Service Worker for Daawat-E-Ramzaan PWA
// Handles: Push Notifications, Offline Caching, Install

const CACHE_NAME = 'der-v1';
const OFFLINE_URL = '/';

// Assets to pre-cache for offline support
const PRECACHE_ASSETS = [
    '/',
    '/der-pwa-icon.png',
    '/der-logo.svg',
    '/manifest.json',
];

// Install: pre-cache essentials
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => clients.claim())
    );
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API calls and external requests
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Serve from cache if network fails
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    // For navigation requests, serve the offline page
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Push Notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push event received');

    let data = { title: 'Daawat E Ramzaan', body: '' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    let bodyText = data.body || '';
    // Replace newlines with a bullet point to improve display on OSes that strip newlines
    bodyText = bodyText.trim().replace(/\r?\n+/g, ' • ');

    const options = {
        body: bodyText,
        icon: '/der-pwa-icon.png',
        badge: '/der-pwa-icon.png',
        vibrate: [200, 100, 200],
        tag: 'der-notification',
        renotify: true,
        data: data,
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
