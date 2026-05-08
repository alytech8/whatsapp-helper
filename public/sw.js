/**
 * WhatsApp Helper — Service Worker
 * Aly Tech · PWA Offline-First Cache Strategy
 */

const CACHE_VERSION = "wa-helper-v1.0.0";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.png"
  // تم الاكتفاء بالأيقونة الموجودة حالياً لضمان نجاح التثبيت
];

// ── INSTALL: pre-cache shell ──────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[SW] Installing:", CACHE_VERSION);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("[SW] Pre-cache failed:", err))
  );
});

// ── ACTIVATE: clean old caches ────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating:", CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => {
            console.log("[SW] Deleting old cache:", k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Cache-first for static, Network-first for API ──────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin except fonts
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin && !url.hostname.includes("fonts.")) return;

  // Google Fonts → Cache-first
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // App shell → Cache-first with network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

// ── Strategies ────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise || new Response("App is offline", { status: 503 });
}

// ── Background Sync (future extension) ───────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-contacts") {
    console.log("[SW] Background sync: contacts");
    // Implement sync logic here if needed
  }
});

// ── Push Notifications (future extension) ────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || "WhatsApp Helper", {
    body:    data.body || "",
    icon:    "/icon.png",
    badge:   "/icon.png",
    vibrate: [200, 100, 200],
    data:    { url: data.url || "/" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
