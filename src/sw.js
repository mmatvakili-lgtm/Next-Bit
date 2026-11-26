/* Next Bit — Zero-Loss Cache Engine (Service Worker)
   Cache-First for immutable media (photos, audio, fonts, icons)
   Stale-While-Revalidate for HTML/CSS/JS so updates always arrive cleanly */
const CACHE = "nextbit-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Heavy media (photos, audio, PDFs, fonts): Cache-First for instant 0ms replay
  const isMedia = /\.(jpg|jpeg|png|webp|svg|mp3|wav|woff2|pdf)$/i.test(
    url.pathname,
  );

  if (isMedia) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(req).then((hit) => {
          if (hit) return hit;
          return fetch(req).then((res) => {
            if (res.ok && res.status === 200) cache.put(req, res.clone());
            return res;
          });
        }),
      ),
    );
    return;
  }

  // HTML, CSS, JS: Stale-While-Revalidate (instant load + background refresh)
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((hit) => {
        const net = fetch(req)
          .then((res) => {
            if (res.ok && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || net;
      }),
    ),
  );
});
