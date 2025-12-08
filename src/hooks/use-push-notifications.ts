"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
  showLocalNotification,
} from '@/lib/push-notifications';

export interface UsePushNotificationsReturn {
  // 상태
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 메서드
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission | null>;
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 초기화
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 지원 여부 확인
        const supported = isPushSupported();
        setIsSupported(supported);

        if (!supported) {
          setPermission('unsupported');
          setIsLoading(false);
          return;
        }

        // 권한 상태 확인
        const currentPermission = getNotificationPermission();
        setPermission(currentPermission);

        // 서비스 워커 등록
        await registerServiceWorker();

        // 구독 상태 확인
        if (currentPermission === 'granted') {
          const subscription = await getPushSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch (err) {
        console.error('Push notification initialization error:', err);
        setError(err instanceof Error ? err.message : '알림 초기화 실패');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // 권한 요청
  const requestPermission = useCallback(async (): Promise<NotificationPermission | null> => {
    if (!isSupported) {
      setError('이 브라우저는 푸시 알림을 지원하지 않습니다');
      return null;
    }

    try {
      setError(null);
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (err) {
      console.error('Permission request error:', err);
      setError('알림 권한 요청 실패');
      return null;
    }
  }, [isSupported]);

  // 구독
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('이 브라우저는 푸시 알림을 지원하지 않습니다');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const subscription = await subscribeToPush();
      
      if (subscription) {
        setIsSubscribed(true);
        setPermission('granted');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : '구독 실패');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 구독 해제
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await unsubscribeFromPush();
      
      if (success) {
        setIsSubscribed(false);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Unsubscription error:', err);
      setError(err instanceof Error ? err.message : '구독 해제 실패');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 알림 표시 (테스트용)
  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions): Promise<void> => {
      try {
        await showLocalNotification(title, options);
      } catch (err) {
        console.error('Show notification error:', err);
        setError('알림 표시 실패');
      }
    },
    []
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    showNotification,
  };
}
