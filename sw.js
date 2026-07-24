const CACHE_NAME = 'kidtomboy-v1.0.0';
const urlsToCache = [
  '/', '/index.html', '/home.html',
  '/assets/css/global.css', '/assets/css/theme-light.css', '/assets/css/theme-dark.css',
  '/assets/css/animations.css', '/assets/css/components.css',
  '/assets/js/core/theme.js', '/assets/js/core/storage.js',
  '/assets/js/core/router.js', '/assets/js/core/state.js',
  '/assets/js/core/audio-engine.js', '/assets/js/core/music-player.js',
  '/assets/js/core/anti-debug.js', '/assets/js/core/devMode.js',
  '/config/secrets.js', '/config/constants.js', '/config/settings.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});