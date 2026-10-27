// Brains & Taxes PWA shell cache. Authenticated pages, APIs, documents and
// user-specific responses are deliberately network-only.
const CACHE_NAME = "brains-taxes-shell-v2";
const OWN_CACHE_PREFIX = "brains-taxes-shell-";
const PRECACHE_URLS = ["/offline.html", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((error) => console.warn("PWA shell cache could not be prepared:", error))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => (name.startsWith(OWN_CACHE_PREFIX) || name === "brains-taxes-v1") && name !== CACHE_NAME)
        .map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache HTML, API JSON, Supabase responses, or document downloads.
  // In particular, do not replay an authenticated page after the session ends.
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match("/offline.html")) || new Response("Offline", { status: 503 });
    }));
    return;
  }

  const isAppShellAsset = url.pathname.startsWith("/_next/static/")
    || url.pathname === "/manifest.json"
    || url.pathname === "/icon.svg"
    || url.pathname === "/offline.html";
  if (!isAppShellAsset) return;

  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(event.request)) || new Response("Offline", { status: 503 });
  }));
});
