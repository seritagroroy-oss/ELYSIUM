self.addEventListener('install', event => {
    // Basic SW install
});

self.addEventListener('fetch', event => {
    // Network first strategy to prevent caching issues with PHP/API
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
