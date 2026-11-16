// Service worker: lưu đệm khung site, mạng trước – lỗi mạng thì dùng bản lưu.
const CACHE = 'kidtomboy-v3';
const SHELL = ['index.html', 'assets/css/site.css', 'assets/icon.svg', 'assets/js/core/theme.js', 'assets/js/components/shell.js', 'assets/js/components/palette.js', 'assets/js/core/site-data.js', '404.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
    return res;
  }).catch(() => caches.match(req)));
});
