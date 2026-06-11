// Service Worker désactivé pour éviter les problèmes de cache en développement
// Le SW est en mode passthrough : réseau first, pas de cache
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
});
