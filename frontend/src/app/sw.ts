import { precacheAndRoute } from "@serwist/precaching";

declare const self: any;

const RUNTIME_CACHE = "arvion-runtime-v1";

// Static assets emitted by the build.
precacheAndRoute(self.__SW_MANIFEST || []);

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n: string) => n.startsWith("arvion-runtime-") && n !== RUNTIME_CACHE)
          .map((n: string) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

// Stale-while-revalidate for same-origin images and fonts only. Product data,
// prices and stock are never cached — they must reflect what the admin set.
self.addEventListener("fetch", (event: any) => {
  const request: Request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!/\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i.test(url.pathname)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })()
  );
});
