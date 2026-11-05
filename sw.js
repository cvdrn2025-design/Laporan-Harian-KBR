const V = 'tbm-v4';
const CORE = ['./', './index.html', './manifest.json', './Icon-192.png', './Icon-512.png'];
const CDN = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

const save = (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(V).then(c => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);

  // File aplikasi sendiri: ambil dari jaringan dulu, cadangan dari cache (offline)
  if (u.origin === location.origin) {
    e.respondWith(
      fetch(req).then(r => save(req, r))
        .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
    return;
  }

  // Pustaka CDN (Firebase SDK, html2canvas): cache dulu agar cepat dan bisa offline
  if (CDN.includes(u.hostname)) {
    e.respondWith(
      caches.match(req).then(m => m || fetch(req).then(r => save(req, r)))
    );
  }

  // Permintaan lain (Firestore, Google API) tidak dicegat sama sekali
});
