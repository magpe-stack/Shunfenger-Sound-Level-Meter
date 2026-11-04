/* =========================================================
   Shunfenger Sound Level Meter
   Service Worker — versão 1.3.0

   Estratégia:
   - Pré-cache dos arquivos essenciais
   - Cache dos recursos visuais disponíveis
   - Funcionamento offline
   - Atualização do cache em segundo plano
   - Limpeza de versões antigas
   ========================================================= */

'use strict';

const CACHE_VERSION = 'v1.3.0';
const CACHE_NAME = `shunfenger-${CACHE_VERSION}`;

const CORE_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

const OPTIONAL_FILES = [
  './logo.svg',
  './logo.png',
  './favicon.ico',
  './splash.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

/* ---------- INSTALAÇÃO ---------- */

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Os arquivos essenciais devem existir.
      await cache.addAll(
        CORE_FILES.map(url => new Request(url, {
          cache: 'reload'
        }))
      );

      // Recursos opcionais não bloqueiam a instalação.
      await Promise.all(
        OPTIONAL_FILES.map(async url => {
          try {
            await cache.add(
              new Request(url, { cache: 'reload' })
            );
          } catch (error) {
            // Arquivo opcional indisponível.
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

/* ---------- ATIVAÇÃO ---------- */

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith('shunfenger-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

/* ---------- REQUISIÇÕES ---------- */

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Não armazenar recursos de outros domínios.
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request, {
        ignoreSearch: true
      });

      const network = fetch(request)
        .then(async response => {
          if (response && response.ok) {
            try {
              const cache = await caches.open(CACHE_NAME);

              await cache.put(
                request,
                response.clone()
              );
            } catch (error) {
              // Falhas de cache não bloqueiam a rede.
            }
          }

          return response;
        })
        .catch(() => null);

      // Entrega rápida pelo cache, com atualização.
      if (cached) {
        event.waitUntil(network);
        return cached;
      }

      // Sem cache: tentar a rede.
      const response = await network;

      if (response) {
        return response;
      }

      // Navegação sem conexão.
      if (request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');

        if (fallback) {
          return fallback;
        }
      }

      return new Response(
        'Recurso indisponível offline.',
        {
          status: 503,
          statusText: 'Offline',
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          }
        }
      );
    })()
  );
});
