/* =========================================================
   Shunfenger Sound Level Meter — Service Worker (sw.js)
   ========================================================= */
const CACHE_VERSION = 'v1.4.1';
const CACHE_NAME = `shunfenger-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './logo.svg',
  './logo.png',
  './favicon.ico',
  './splash.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

// Instalação: Pré-cache do app shell de forma segura
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Ativação: Remove versões antigas do cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('shunfenger-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Interceptação de requisições (Stale-While-Revalidate seguro)
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cachedResponse => {
      const fetchAndUpdate = fetch(req)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Falha na rede silenciosa (offline)
          return null;
        });

      // Se temos em cache, retorna imediatamente e atualiza em segundo plano
      if (cachedResponse) {
        event.waitUntil(fetchAndUpdate);
        return cachedResponse;
      }

      // Se não está no cache, aguarda a rede responder
      return fetchAndUpdate.then(networkResponse => {
        if (networkResponse) return networkResponse;
        
        // Fallback para navegação SPA/PWA offline
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
        
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
