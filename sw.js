// Service worker mínimo: só permite instalar como app. Não guarda nada em cache —
// todas as requisições vão direto para a rede.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
