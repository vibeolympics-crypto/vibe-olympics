// Service Worker for Vibe Olympics PWA
// 버전 2.0 - 향상된 오프라인 지원 & 캐싱 전략

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `vibe-olympics-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `vibe-olympics-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `vibe-olympics-images-${CACHE_VERSION}`;
const API_CACHE = `vibe-olympics-api-${CACHE_VERSION}`;

const OFFLINE_URL = '/offline.html';

// 정적 리소스 (앱 셸)
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

// 캐시 가능한 API 엔드포인트 (GET만)
const CACHEABLE_API_PATTERNS = [
  /\/api\/products\?/,  // 상품 목록
  /\/api\/products\/[^/]+$/,  // 상품 상세
  /\/api\/categories/,  // 카테고리
  /\/api\/reviews\?/,  // 리뷰 목록
];

// 캐시 제외 API
const NO_CACHE_API_PATTERNS = [
  /\/api\/auth/,  // 인증
  /\/api\/notifications/,  // 알림 (실시간)
  /\/api\/cart/,  // 장바구니
  /\/api\/orders/,  // 주문
  /\/api\/recommendations/,  // 추천 (개인화)
];

// 캐시 유효 시간 (밀리초)
const CACHE_EXPIRY = {
  static: 7 * 24 * 60 * 60 * 1000,  // 7일
  dynamic: 24 * 60 * 60 * 1000,  // 1일
  api: 5 * 60 * 1000,  // 5분
  image: 30 * 24 * 60 * 60 * 1000,  // 30일
};

// ============================================
// 설치 이벤트
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// ============================================
// 활성화 이벤트
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // 현재 버전이 아닌 캐시 삭제
              return name.startsWith('vibe-olympics-') && 
                     !name.endsWith(CACHE_VERSION);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// ============================================
// Fetch 이벤트 - 캐싱 전략
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 같은 오리진만 처리
  if (url.origin !== location.origin) {
    return;
  }
  
  // POST, PUT, DELETE 등은 네트워크로
  if (request.method !== 'GET') {
    return;
  }

  // API 요청 처리
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // 이미지 요청 처리
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // 페이지 요청 처리 (Network First + Cache Fallback)
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(handlePageRequest(request));
    return;
  }
  
  // 기타 정적 리소스 (Stale While Revalidate)
  event.respondWith(handleStaticRequest(request));
});

// ============================================
// API 요청 핸들러 (Network First + Cache Fallback)
// ============================================
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // 캐시 제외 API 체크
  for (const pattern of NO_CACHE_API_PATTERNS) {
    if (pattern.test(url.pathname)) {
      return fetch(request);
    }
  }
  
  // 캐시 가능 API 체크
  let isCacheable = false;
  for (const pattern of CACHEABLE_API_PATTERNS) {
    if (pattern.test(url.pathname + url.search)) {
      isCacheable = true;
      break;
    }
  }
  
  if (!isCacheable) {
    return fetch(request);
  }
  
  try {
    // 네트워크 우선
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 성공시 캐시 저장
      const cache = await caches.open(API_CACHE);
      const responseToCache = networkResponse.clone();
      
      // 타임스탬프와 함께 저장
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // 네트워크 실패시 캐시 사용
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      const cachedAt = parseInt(cachedResponse.headers.get('sw-cached-at') || '0');
      const isExpired = Date.now() - cachedAt > CACHE_EXPIRY.api;
      
      if (!isExpired) {
        console.log('[SW] Serving cached API response:', request.url);
        return cachedResponse;
      }
    }
    
    // 캐시도 없으면 오프라인 JSON 응답
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.',
        cached: false,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ============================================
// 페이지 요청 핸들러 (Network First + Offline Page)
// ============================================
async function handlePageRequest(request) {
  try {
    // 네트워크 우선
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 성공시 동적 캐시에 저장
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 네트워크 실패시 캐시 확인
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving cached page:', request.url);
      return cachedResponse;
    }
    
    // 캐시도 없으면 오프라인 페이지
    console.log('[SW] Serving offline page');
    return caches.match(OFFLINE_URL);
  }
}

// ============================================
// 이미지 요청 핸들러 (Cache First + Network Fallback)
// ============================================
async function handleImageRequest(request) {
  // 캐시 우선
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // 백그라운드에서 업데이트
    updateImageCache(request);
    return cachedResponse;
  }
  
  try {
    // 네트워크에서 가져오기
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 플레이스홀더 이미지 반환
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect fill="#1a1a2e" width="200" height="200"/>
        <text fill="#666" x="100" y="100" text-anchor="middle" dy=".3em" font-size="14">이미지 로드 실패</text>
      </svg>`,
      {
        headers: { 'Content-Type': 'image/svg+xml' },
      }
    );
  }
}

// 백그라운드 이미지 업데이트
async function updateImageCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // 무시
  }
}

// ============================================
// 정적 리소스 핸들러 (Stale While Revalidate)
// ============================================
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  // 백그라운드에서 네트워크 업데이트
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(STATIC_CACHE);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  // 캐시가 있으면 즉시 반환, 없으면 네트워크 대기
  return cachedResponse || fetchPromise;
}

// ============================================
// 유틸리티 함수
// ============================================
function isImageRequest(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'image' ||
    /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)
  );
}

// ============================================
// 푸시 알림 처리
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'Vibe Olympics',
    body: '새로운 알림이 있습니다',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'default',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (_e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'view', title: '보기' },
      { action: 'dismiss', title: '닫기' },
    ],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ============================================
// 알림 클릭 처리
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 탭 찾기
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then((focusedClient) => {
              if ('navigate' in focusedClient) {
                return focusedClient.navigate(urlToOpen);
              }
            });
          }
        }
        // 새 탭 열기
        return clients.openWindow(urlToOpen);
      })
  );
});

// ============================================
// 백그라운드 동기화
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  switch (event.tag) {
    case 'sync-cart':
      event.waitUntil(syncCart());
      break;
    case 'sync-wishlist':
      event.waitUntil(syncWishlist());
      break;
    case 'sync-notifications':
      event.waitUntil(syncNotifications());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

async function syncCart() {
  try {
    // IndexedDB에서 오프라인 장바구니 변경사항 가져오기
    const pendingChanges = await getPendingCartChanges();
    
    if (pendingChanges.length > 0) {
      const response = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: pendingChanges }),
      });
      
      if (response.ok) {
        await clearPendingCartChanges();
        console.log('[SW] Cart synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Cart sync failed:', error);
  }
}

async function syncWishlist() {
  try {
    const response = await fetch('/api/wishlist');
    if (response.ok) {
      console.log('[SW] Wishlist synced');
    }
  } catch (error) {
    console.error('[SW] Wishlist sync failed:', error);
  }
}

async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications?unreadOnly=true');
    if (response.ok) {
      const data = await response.json();
      console.log('[SW] Notifications synced, unread:', data.unreadCount);
    }
  } catch (error) {
    console.error('[SW] Notifications sync failed:', error);
  }
}

// IndexedDB 헬퍼 (간단 구현)
async function getPendingCartChanges() {
  // TODO: IndexedDB에서 실제 데이터 가져오기
  return [];
}

async function clearPendingCartChanges() {
  // TODO: IndexedDB 정리
}

// ============================================
// 메시지 핸들러
// ============================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(event.data.urls));
      break;
    
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCache());
      break;
    
    case 'GET_CACHE_SIZE':
      event.waitUntil(getCacheSize(event));
      break;
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.addAll(urls);
  console.log('[SW] URLs cached:', urls.length);
}

async function clearAllCache() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith('vibe-olympics-'))
      .map((name) => caches.delete(name))
  );
  console.log('[SW] All caches cleared');
}

async function getCacheSize(event) {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    if (name.startsWith('vibe-olympics-')) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
  }
  
  event.ports[0]?.postMessage({
    type: 'CACHE_SIZE',
    size: totalSize,
    sizeFormatted: formatBytes(totalSize),
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================
// 푸시 알림 핸들러 (P12-11)
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Vibe Olympics',
    body: '새로운 알림이 있습니다.',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'default',
    data: { url: '/' },
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (error) {
    console.error('[SW] Push data parse error:', error);
    if (event.data) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: '열기' },
      { action: 'dismiss', title: '닫기' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 알림 클릭 핸들러
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// 알림 닫기 핸들러
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // 분석 이벤트 전송 가능
  // analytics.track('notification_closed', { tag: event.notification.tag });
});

// ============================================
// 백그라운드 동기화 이벤트 (P12-11)
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  switch (event.tag) {
    case 'sync-cart':
      event.waitUntil(syncCart());
      break;
    
    case 'sync-wishlist':
      event.waitUntil(syncWishlist());
      break;
    
    case 'sync-offline-actions':
      event.waitUntil(syncOfflineActions());
      break;
    
    case 'sync-analytics':
      event.waitUntil(syncAnalytics());
      break;
    
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// 주기적 백그라운드 동기화
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  switch (event.tag) {
    case 'update-content':
      event.waitUntil(updateContent());
      break;
    
    case 'check-notifications':
      event.waitUntil(checkNotifications());
      break;
    
    default:
      console.log('[SW] Unknown periodic sync tag:', event.tag);
  }
});

// 오프라인 액션 동기화
async function syncOfflineActions() {
  try {
    const actions = await getOfflineActions();
    
    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });
        
        if (response.ok) {
          await removeOfflineAction(action.id);
          console.log('[SW] Offline action synced:', action.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Offline actions sync failed:', error);
  }
}

// 분석 데이터 동기화
async function syncAnalytics() {
  try {
    const events = await getAnalyticsEvents();
    
    if (events.length > 0) {
      const response = await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
      
      if (response.ok) {
        await clearAnalyticsEvents();
        console.log('[SW] Analytics synced:', events.length, 'events');
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
  }
}

// 콘텐츠 업데이트
async function updateContent() {
  try {
    // 인기 상품 프리캐싱
    const response = await fetch('/api/products?sort=popular&limit=10');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put('/api/products?sort=popular&limit=10', response.clone());
      console.log('[SW] Popular products cached');
    }
  } catch (error) {
    console.error('[SW] Content update failed:', error);
  }
}

// 알림 확인
async function checkNotifications() {
  try {
    const response = await fetch('/api/notifications/unread-count');
    if (response.ok) {
      const data = await response.json();
      
      if (data.count > 0) {
        // 앱 배지 업데이트 (지원되는 경우)
        if ('setAppBadge' in navigator) {
          navigator.setAppBadge(data.count);
        }
        
        // 클라이언트에게 알림
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({
            type: 'UNREAD_NOTIFICATIONS',
            count: data.count,
          });
        });
      }
    }
  } catch (error) {
    console.error('[SW] Notifications check failed:', error);
  }
}

// IndexedDB 헬퍼 함수들
async function getOfflineActions() {
  // TODO: IndexedDB에서 오프라인 액션 가져오기
  return [];
}

async function removeOfflineAction(id) {
  // TODO: IndexedDB에서 액션 삭제
}

async function getAnalyticsEvents() {
  // TODO: IndexedDB에서 분석 이벤트 가져오기
  return [];
}

async function clearAnalyticsEvents() {
  // TODO: IndexedDB 정리
}

console.log('[SW] Service Worker v2 loaded');
