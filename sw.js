// 맛집지도 서비스 워커 — 앱 껍데기 캐싱 (업데이트 시 CACHE 버전을 올리세요)
const CACHE = 'foodmap-v4';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // shave-iq 프로토타입은 캐시하지 않음 (항상 네트워크)
  if (url.origin === location.origin && url.pathname.includes('/shave-iq/')) return;

  // 페이지(HTML)는 네트워크 우선 → 오프라인이면 캐시
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => { caches.open(CACHE).then(c => c.put('./index.html', r.clone())); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 같은 출처의 정적 파일 + 라이브러리 CDN은 캐시 우선
  const isShell = url.origin === location.origin;
  const isLib = url.hostname === 'unpkg.com' || url.hostname === 'cdn.jsdelivr.net';
  if (isShell || isLib) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      }))
    );
  }
  // 지도 타일, API 호출 등은 그대로 네트워크로
});
