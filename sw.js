/* Offline support. Paths are relative so it works under /nu-stats-cgpa-calculator/ too.
   I bump CACHE whenever the file list changes. */
var CACHE = 'nu-stats-cgpa-v5';
var ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './calc.js',
  './data.js',
  './i18n.js',
  './manifest.webmanifest',
  './og.png',
  './icons/favicon.svg',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isAppShell(req, url) {
  return req.mode === 'navigate' || /\.(?:html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.slice(-1) === '/';
}

function putInCache(req, res) {
  if (res && res.ok && res.type === 'basic') {
    var copy = res.clone();
    caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
  }
  return res;
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isAppShell(req, url)) {
    // network first so updates show up straight away, cache only when offline
    event.respondWith(
      fetch(req, { cache: 'no-cache' }).then(function (res) { return putInCache(req, res); }).catch(function () {
        return caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (hit) {
          if (hit) return hit;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // icons and images rarely change, so cache first
  event.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { return putInCache(req, res); }).catch(function () {
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
