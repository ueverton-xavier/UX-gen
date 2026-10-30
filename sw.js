// Service worker mínimo: permite instalar como app e não guarda nada em cache.
// A página é sempre buscada na rede (cache: no-store), então atualizações chegam na hora.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") e.respondWith(fetch(e.request, { cache: "no-store" }));
});
