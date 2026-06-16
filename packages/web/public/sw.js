// Service Worker — Corrida Certa
// App shell + cache de tiles do mapa para funcionar offline
const CACHE = "corrida-certa-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Tiles do mapa (CARTO/OSM): cache-first, guarda o que visitou
  if (/basemaps\.cartocdn\.com|tile\.openstreetmap\.org|unpkg\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // Navegação: network-first, fallback pro app shell (offline)
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/index.html").then((r) => r || caches.match("/"))));
    return;
  }

  // Demais assets: stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      const fetchPromise = fetch(req).then((res) => {
        if (res.ok && url.origin === self.location.origin) cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || fetchPromise;
    })
  );
});
