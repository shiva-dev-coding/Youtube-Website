const CACHE_NAME = "shivahub-shell-v1";
const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./icons/app-icon.svg"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith("shivahub-shell-") && cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const requestUrl = new URL(request.url);
    if(request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

    if(request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if(response.ok) {
                        const responseCopy = response.clone();
                        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, responseCopy)));
                    }
                    return response;
                })
                .catch(async () => (await caches.match(request)) || caches.match("./index.html"))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(cachedResponse => cachedResponse || fetch(request))
    );
});
