// Naikkan nomor versi setiap kali index.html/logo diubah agar pembaruan langsung sampai
const CACHE = 'presensi-gtk-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'logo.png', 'icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const sameOrigin = url.origin === location.origin;
  const cdn = url.hostname === 'cdn.jsdelivr.net';
  if (!sameOrigin && !cdn) return; // script.google.com (API) dan lainnya: jangan disentuh

  if (cdn) { // Bootstrap: cache-first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
    return;
  }
  // File milik sendiri: network-first, cadangan dari cache saat offline
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
  );
});
