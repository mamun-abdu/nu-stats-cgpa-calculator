/* Offline cache for Stats CGPA. Scope is the folder this file lives in,
   so it works on GitHub Pages at /nu-stats-cgpa-calculator/ and on a local server. */
/* Bump CACHE on every deploy that changes the asset list. Pages, scripts and styles are
   fetched network-first, so a normal deploy reaches users on the next online load. */
var CACHE = 'nu-stats-cgpa-v2';
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
    // Network first so new deploys show up; fall back to cache offline.
    event.respondWith(
      fetch(req).then(function (res) { return putInCache(req, res); }).catch(function () {
        return caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (hit) {
          if (hit) return hit;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // Icons, fonts, images: cache first.
  event.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { return putInCache(req, res); }).catch(function () {
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
