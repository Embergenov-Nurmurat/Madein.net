/* Madein.net — Service Worker
   1) Sayt tezroq ishlashi uchun statik fayllarni (CSS/JS/rasm/uploads)
      keshlaydi — internet sekin bo'lsa ham interfeys darhol ochiladi.
   2) Push xabarnomalarni qabul qilib, tizim bildirishnomasi ko'rsatadi
      (ilova yopiq bo'lsa ham). */

const CACHE_VERSION = 'madein-v1';
const SHELL_CACHE = CACHE_VERSION + '-shell';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

const SHELL_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/favicon-192.png',
  '/favicon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('madein-') && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // POST/PUT/DELETE keshlanmaydi (ma'lumot o'zgartiruvchi so'rovlar)

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // faqat o'z domenimizni boshqaramiz

  // API so'rovlari — doim tarmoqdan (real vaqtdagi ma'lumot, keshlanmaydi)
  if (url.pathname.startsWith('/api/')) return;

  // Sahifa navigatsiyasi (HTML) — avval tarmoq, bo'lmasa keshdan (offline holat)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Yuklangan rasm/video (/uploads/) — fayl nomi tasodifiy hash bo'lgani
  // uchun bir marta yuklangach o'zgarmaydi: kesh-birinchi (tez va trafik tejaydi)
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
    return;
  }

  // Qolgan statik fayllar (CSS/JS/ikonlar/shriftlar) — kesh-birinchi,
  // fonda yangilanadi (stale-while-revalidate): tezkor ko'rsatish + yangilanish
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

/* ===================== PUSH XABARNOMALAR ===================== */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  const title = data.title || 'Madein.net';
  const options = {
    body: data.body || '',
    icon: '/favicon-192.png',
    badge: '/favicon-192.png',
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Foydalanuvchi ilovani ochiq va faol (fokusda) ko'rib turgan bo'lsa,
      // tizim bildirishnomasi bilan bezovta qilmaymiz.
      const isFocused = clients.some((c) => c.focused);
      if (isFocused) return;
      return self.registration.showNotification(title, options);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
