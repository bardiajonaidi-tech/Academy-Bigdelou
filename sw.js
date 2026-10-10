/* Tiny service worker: lets the site be installed on a phone. Network first, so you always get the newest version;
   the saved copy is used only when the phone is offline. Data (Supabase) is never cached. */
const CACHE = 'coach-shell-v2';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'api-supabase.js', 'config.js', 'img/logo-white-sm.png', 'img/logo-round.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)).catch(() => {}); return res; }).catch(() => caches.match(r)));
});
