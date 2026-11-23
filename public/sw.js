/* antidosis service worker — exists primarily to make the site installable
   (Chrome requires a fetch-handling SW for beforeinstallprompt). Strategy is
   deliberately conservative: cache-first only for immutable static assets,
   everything else goes straight to the network. We never serve cached HTML,
   so no risk of stale shells after a deploy. */
const VERSION = "antidosis-v1";
const STATIC_CACHE = `${VERSION}-static`;

const STATIC_PREFIXES = ["/_next/static/", "/images/", "/favicon", "/icon-", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(["/icon-192.png", "/icon-512.png"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for navigations and API — always fresh, never cached.
  if (request.mode === "navigate" || url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first for immutable static assets only.
  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        });
      })
    );
  }
  // Everything else: default browser handling.
});
