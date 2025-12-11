/**
 * 오프라인 상태 관리 훅
 * - 네트워크 상태 감지
 * - 오프라인 데이터 저장 (IndexedDB)
 * - 백그라운드 동기화 요청
 */

import { useState, useEffect, useCallback } from 'react';

interface OfflineState {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  cacheSize: string | null;
  lastSyncTime: Date | null;
}

interface PendingAction {
  id: string;
  type: 'cart' | 'wishlist' | 'review';
  action: 'add' | 'remove' | 'update';
  data: Record<string, unknown>;
  timestamp: number;
}

const DB_NAME = 'vibe-olympics-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-actions';

// IndexedDB 초기화
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isServiceWorkerReady: false,
    cacheSize: null,
    lastSyncTime: null,
  });

  // 네트워크 상태 변경 감지
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      // 온라인 복귀 시 동기화 시도
      triggerBackgroundSync();
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service Worker 상태 확인
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setState((prev) => ({ ...prev, isServiceWorkerReady: true }));
      });
    }
  }, []);

  // 백그라운드 동기화 트리거
  const triggerBackgroundSync = useCallback(async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-cart');
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-wishlist');
        setState((prev) => ({ ...prev, lastSyncTime: new Date() }));
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }, []);

  // 캐시 크기 조회
  const getCacheSize = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      return new Promise<string>((resolve) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHE_SIZE') {
            setState((prev) => ({ ...prev, cacheSize: event.data.sizeFormatted }));
            resolve(event.data.sizeFormatted);
          }
        };

        registration.active?.postMessage(
          { type: 'GET_CACHE_SIZE' },
          [messageChannel.port2]
        );
      });
    }
    return null;
  }, []);

  // 캐시 삭제
  const clearCache = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'CLEAR_CACHE' });
      setState((prev) => ({ ...prev, cacheSize: '0 Bytes' }));
    }
  }, []);

  // 페이지 사전 캐싱
  const precachePages = useCallback(async (urls: string[]) => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'CACHE_URLS', urls });
    }
  }, []);

  // 오프라인 액션 저장
  const savePendingAction = useCallback(async (action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      const pendingAction: PendingAction = {
        ...action,
        id: `${action.type}-${action.action}-${Date.now()}`,
        timestamp: Date.now(),
      };
      
      store.add(pendingAction);
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      
      return pendingAction.id;
    } catch (error) {
      console.error('Failed to save pending action:', error);
      return null;
    }
  }, []);

  // 대기 중인 액션 조회
  const getPendingActions = useCallback(async (): Promise<PendingAction[]> => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get pending actions:', error);
      return [];
    }
  }, []);

  // 대기 중인 액션 삭제
  const clearPendingActions = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('Failed to clear pending actions:', error);
    }
  }, []);

  return {
    ...state,
    triggerBackgroundSync,
    getCacheSize,
    clearCache,
    precachePages,
    savePendingAction,
    getPendingActions,
    clearPendingActions,
  };
}

export type { OfflineState, PendingAction };
