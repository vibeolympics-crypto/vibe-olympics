// Service Worker for Push Notifications
// Vibe Olympics PWA Support

const CACHE_NAME = 'vibe-olympics-v1';
const OFFLINE_URL = '/offline.html';

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // 모든 클라이언트 제어
  self.clients.claim();
});

// Fetch 이벤트 (오프라인 지원)
self.addEventListener('fetch', (event) => {
  // API 요청은 캐시하지 않음
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        // 오프라인일 때 HTML 요청이면 오프라인 페이지 반환
        if (event.request.headers.get('Accept')?.includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    })
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  let data = {
    title: 'Vibe Olympics',
    body: '새로운 알림이 있습니다',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
      };
    } catch (e) {
      // JSON 파싱 실패 시 텍스트로 처리
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || 'notification',
    data: data.data || { url: '/' },
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  // 액션 버튼 클릭 처리
  if (event.action) {
    switch (event.action) {
      case 'view':
        // 해당 URL로 이동
        break;
      case 'dismiss':
        // 알림 닫기만 하고 아무것도 하지 않음
        return;
      default:
        break;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 탭이 있으면 해당 탭으로 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if ('navigate' in focusedClient) {
              return focusedClient.navigate(urlToOpen);
            }
          });
        }
      }
      // 열린 탭이 없으면 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 알림 닫기 이벤트
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed');
});

// 백그라운드 동기화 (오프라인 -> 온라인 복구 시)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// 알림 동기화 함수
async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications?unreadOnly=true');
    if (response.ok) {
      const data = await response.json();
      console.log('[Service Worker] Synced notifications:', data.unreadCount);
    }
  } catch (error) {
    console.error('[Service Worker] Failed to sync notifications:', error);
  }
}

// 메시지 수신 (클라이언트 -> 서비스 워커)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
