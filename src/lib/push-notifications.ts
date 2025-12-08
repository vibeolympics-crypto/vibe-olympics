// 푸시 알림 유틸리티
// Web Push API 관련 기능

// VAPID 공개키 (환경 변수에서 가져옴)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

// 서비스 워커 지원 여부 확인
export const isPushSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// 알림 권한 상태 확인
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// 알림 권한 요청
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('이 브라우저는 알림을 지원하지 않습니다');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// Base64 URL을 Uint8Array로 변환
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

// 서비스 워커 등록
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) {
    console.warn('Service Worker is not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// 서비스 워커 등록 정보 가져오기
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) return null;

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('Failed to get service worker registration:', error);
    return null;
  }
};

// 푸시 구독 생성
export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID public key is not configured');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return null;
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    console.error('No service worker registration');
    return null;
  }

  try {
    // 기존 구독 확인
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Existing push subscription found');
      return existingSubscription;
    }

    // 새 구독 생성
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log('Push subscription created:', subscription);

    // 서버에 구독 정보 저장
    await saveSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
};

// 푸시 구독 해제
export const unsubscribeFromPush = async (): Promise<boolean> => {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return false;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    // 서버에서 구독 정보 삭제
    await removeSubscriptionFromServer(subscription);

    // 구독 해제
    await subscription.unsubscribe();
    console.log('Push subscription removed');
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
};

// 현재 푸시 구독 상태 확인
export const getPushSubscription = async (): Promise<PushSubscription | null> => {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return null;

  try {
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Failed to get push subscription:', error);
    return null;
  }
};

// 서버에 구독 정보 저장
async function saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/notifications/push-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription to server');
    }
  } catch (error) {
    console.error('Error saving subscription:', error);
    throw error;
  }
}

// 서버에서 구독 정보 삭제
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/notifications/push-subscription', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription from server');
    }
  } catch (error) {
    console.error('Error removing subscription:', error);
    // 삭제 실패해도 로컬 구독은 해제
  }
}

// 로컬 테스트용 알림 표시
export const showLocalNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  const permission = getNotificationPermission();
  
  if (permission === 'unsupported') {
    console.warn('Notifications not supported');
    return;
  }

  if (permission !== 'granted') {
    const newPermission = await requestNotificationPermission();
    if (newPermission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }
  }

  const registration = await getServiceWorkerRegistration();
  
  const defaultOptions: NotificationOptions = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    ...options,
  };

  if (registration) {
    // 서비스 워커를 통해 알림 표시
    await registration.showNotification(title, defaultOptions);
  } else {
    // 폴백: 브라우저 Notification API 사용
    new Notification(title, defaultOptions);
  }
};

// 푸시 알림 타입
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: unknown;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
}
