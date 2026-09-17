// Arvio v3.5.0 recovery worker.
// This intentionally performs no fetch interception. It cleans legacy Arvio
// caches and unregisters itself so production always comes from the network
// while the PWA caching layer is being rebuilt safely.

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      await Promise.allSettled(names.filter(name => name.startsWith("arvio-")).map(name => caches.delete(name)));
    } catch {}
    try {
      await self.registration.unregister();
    } catch {}
    try {
      await self.clients.claim();
    } catch {}
  })());
});
