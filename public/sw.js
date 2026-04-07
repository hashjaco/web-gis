const TILE_CACHE = "gis-tiles-v2";
const API_CACHE = "gis-api-v1";
const STATIC_CACHE = "gis-static-v1";
const TILE_PATTERNS = [
  /\/\d+\/\d+\/\d+\.pbf$/,
  /\/\d+\/\d+\/\d+\.png$/,
  /\/\d+\/\d+\/\d+\.jpg$/,
  /\/\d+\/\d+\/\d+\.webp$/,
  /api\.maptiler\.com/,
  /demotiles\.maplibre\.org/,
  /earth-search\.aws/,
];

self.addEventListener("install", (_event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== TILE_CACHE &&
                key !== API_CACHE &&
                key !== STATIC_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  const isTile = TILE_PATTERNS.some((pattern) => pattern.test(url));

  if (isTile) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request)
            .then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => null);

          if (cached) {
            fetchPromise.catch(() => {});
            return cached;
          }
          return fetchPromise.then(
            (res) => res || new Response("", { status: 503 }),
          );
        }),
      ),
    );
    return;
  }

  if (event.request.method === "GET" && url.includes("/api/")) {
    if (url.includes("/api/route")) return;
    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        fetch(event.request)
          .then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() =>
            cache.match(event.request).then(
              (cached) =>
                cached ||
                new Response('{"error":"offline"}', {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                }),
            ),
          ),
      ),
    );
    return;
  }

  if (
    event.request.method === "POST" ||
    event.request.method === "PUT" ||
    event.request.method === "DELETE"
  ) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(
            JSON.stringify({
              error: "offline",
              queued: true,
              message: "Change queued for sync when online",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            },
          ),
      ),
    );
  }
});
