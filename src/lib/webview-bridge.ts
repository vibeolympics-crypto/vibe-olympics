/**
 * React Native 웹뷰 브릿지 유틸리티
 * - 웹앱 ↔ 네이티브 앱 통신
 * - 푸시 알림, 딥링크, 네이티브 기능 호출
 */

// ==================== 타입 정의 ====================

export interface NativeBridge {
  // 디바이스 정보
  getDeviceInfo: () => Promise<DeviceInfo>;
  getPushToken: () => Promise<string | null>;
  
  // 네이티브 기능
  shareContent: (content: ShareContent) => Promise<boolean>;
  openExternalUrl: (url: string) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<boolean>;
  vibrate: (pattern?: number[]) => void;
  
  // 스토리지
  setStorageItem: (key: string, value: string) => Promise<void>;
  getStorageItem: (key: string) => Promise<string | null>;
  removeStorageItem: (key: string) => Promise<void>;
  
  // 인증
  getBiometricAuth: () => Promise<BiometricResult>;
  
  // 알림
  requestNotificationPermission: () => Promise<boolean>;
  showLocalNotification: (notification: LocalNotification) => Promise<void>;
  
  // 앱 상태
  getAppState: () => Promise<AppState>;
  onAppStateChange: (callback: (state: AppState) => void) => () => void;
  
  // 네비게이션
  goBack: () => void;
  canGoBack: () => Promise<boolean>;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  version: string;
  model: string;
  uniqueId: string;
  appVersion: string;
  buildNumber: string;
  isTablet: boolean;
  hasNotch: boolean;
  screenWidth: number;
  screenHeight: number;
  statusBarHeight: number;
}

export interface ShareContent {
  title?: string;
  message: string;
  url?: string;
  imageUrl?: string;
}

export interface BiometricResult {
  available: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'none';
  authenticated: boolean;
  error?: string;
}

export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  scheduledTime?: Date;
  badge?: number;
  sound?: string;
}

export type AppState = 'active' | 'background' | 'inactive';

export interface WebViewMessage {
  type: string;
  payload?: unknown;
  callbackId?: string;
}

export interface NativeMessage {
  type: string;
  payload?: unknown;
  error?: string;
  callbackId?: string;
}

// ==================== 브릿지 구현 ====================

// 콜백 관리
const pendingCallbacks = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}>();

let callbackIdCounter = 0;

function generateCallbackId(): string {
  return `cb_${Date.now()}_${++callbackIdCounter}`;
}

// 네이티브에 메시지 전송
function postToNative(message: WebViewMessage): void {
  // React Native WebView
  if (typeof window !== 'undefined' && (window as unknown as { ReactNativeWebView?: { postMessage: (msg: string) => void } }).ReactNativeWebView) {
    (window as unknown as { ReactNativeWebView: { postMessage: (msg: string) => void } }).ReactNativeWebView.postMessage(JSON.stringify(message));
    return;
  }
  
  // iOS WKWebView
  if (typeof window !== 'undefined' && (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: string) => void } } } }).webkit?.messageHandlers?.nativeBridge) {
    (window as unknown as { webkit: { messageHandlers: { nativeBridge: { postMessage: (msg: string) => void } } } }).webkit.messageHandlers.nativeBridge.postMessage(JSON.stringify(message));
    return;
  }
  
  // Android WebView
  if (typeof window !== 'undefined' && (window as unknown as { Android?: { postMessage: (msg: string) => void } }).Android) {
    (window as unknown as { Android: { postMessage: (msg: string) => void } }).Android.postMessage(JSON.stringify(message));
    return;
  }
  
  // 웹 환경에서는 console 출력
  console.log('[WebView Bridge - Web Mode]', message);
}

// 프로미스 기반 네이티브 호출
function callNative<T>(type: string, payload?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackId = generateCallbackId();
    
    pendingCallbacks.set(callbackId, { resolve: resolve as (value: unknown) => void, reject });
    
    // 타임아웃 설정
    setTimeout(() => {
      if (pendingCallbacks.has(callbackId)) {
        pendingCallbacks.delete(callbackId);
        reject(new Error('Native call timeout'));
      }
    }, 30000);
    
    postToNative({ type, payload, callbackId });
  });
}

// 네이티브에서 메시지 수신
export function handleNativeMessage(message: NativeMessage): void {
  const { type, payload, error, callbackId } = message;
  
  // 콜백 응답 처리
  if (callbackId && pendingCallbacks.has(callbackId)) {
    const callback = pendingCallbacks.get(callbackId)!;
    pendingCallbacks.delete(callbackId);
    
    if (error) {
      callback.reject(new Error(error));
    } else {
      callback.resolve(payload);
    }
    return;
  }
  
  // 이벤트 처리
  switch (type) {
    case 'APP_STATE_CHANGE':
      appStateListeners.forEach(listener => listener(payload as AppState));
      break;
    case 'PUSH_NOTIFICATION':
      pushNotificationListeners.forEach(listener => listener(payload as Record<string, unknown>));
      break;
    case 'DEEP_LINK':
      deepLinkListeners.forEach(listener => listener(payload as string));
      break;
    default:
      console.log('[WebView Bridge] Unknown message:', type, payload);
  }
}

// 이벤트 리스너
const appStateListeners = new Set<(state: AppState) => void>();
const pushNotificationListeners = new Set<(data: Record<string, unknown>) => void>();
const deepLinkListeners = new Set<(url: string) => void>();

// ==================== 브릿지 API ====================

export const nativeBridge: NativeBridge = {
  // 디바이스 정보
  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!isNativeApp()) {
      return getWebDeviceInfo();
    }
    return callNative<DeviceInfo>('GET_DEVICE_INFO');
  },
  
  async getPushToken(): Promise<string | null> {
    if (!isNativeApp()) return null;
    return callNative<string | null>('GET_PUSH_TOKEN');
  },
  
  // 공유
  async shareContent(content: ShareContent): Promise<boolean> {
    if (!isNativeApp()) {
      // Web Share API 사용
      if (navigator.share) {
        try {
          await navigator.share({
            title: content.title,
            text: content.message,
            url: content.url,
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
    return callNative<boolean>('SHARE_CONTENT', content);
  },
  
  async openExternalUrl(url: string): Promise<boolean> {
    if (!isNativeApp()) {
      window.open(url, '_blank');
      return true;
    }
    return callNative<boolean>('OPEN_EXTERNAL_URL', { url });
  },
  
  async copyToClipboard(text: string): Promise<boolean> {
    if (!isNativeApp()) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return callNative<boolean>('COPY_TO_CLIPBOARD', { text });
  },
  
  vibrate(pattern?: number[]): void {
    if (!isNativeApp()) {
      if (navigator.vibrate) {
        navigator.vibrate(pattern || [100]);
      }
      return;
    }
    postToNative({ type: 'VIBRATE', payload: { pattern } });
  },
  
  // 스토리지
  async setStorageItem(key: string, value: string): Promise<void> {
    if (!isNativeApp()) {
      localStorage.setItem(key, value);
      return;
    }
    return callNative('SET_STORAGE_ITEM', { key, value });
  },
  
  async getStorageItem(key: string): Promise<string | null> {
    if (!isNativeApp()) {
      return localStorage.getItem(key);
    }
    return callNative<string | null>('GET_STORAGE_ITEM', { key });
  },
  
  async removeStorageItem(key: string): Promise<void> {
    if (!isNativeApp()) {
      localStorage.removeItem(key);
      return;
    }
    return callNative('REMOVE_STORAGE_ITEM', { key });
  },
  
  // 생체 인증
  async getBiometricAuth(): Promise<BiometricResult> {
    if (!isNativeApp()) {
      return { available: false, type: 'none', authenticated: false };
    }
    return callNative<BiometricResult>('GET_BIOMETRIC_AUTH');
  },
  
  // 알림
  async requestNotificationPermission(): Promise<boolean> {
    if (!isNativeApp()) {
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return false;
    }
    return callNative<boolean>('REQUEST_NOTIFICATION_PERMISSION');
  },
  
  async showLocalNotification(notification: LocalNotification): Promise<void> {
    if (!isNativeApp()) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          data: notification.data,
        });
      }
      return;
    }
    return callNative('SHOW_LOCAL_NOTIFICATION', notification);
  },
  
  // 앱 상태
  async getAppState(): Promise<AppState> {
    if (!isNativeApp()) {
      return document.visibilityState === 'visible' ? 'active' : 'background';
    }
    return callNative<AppState>('GET_APP_STATE');
  },
  
  onAppStateChange(callback: (state: AppState) => void): () => void {
    if (!isNativeApp()) {
      const handler = () => {
        callback(document.visibilityState === 'visible' ? 'active' : 'background');
      };
      document.addEventListener('visibilitychange', handler);
      return () => document.removeEventListener('visibilitychange', handler);
    }
    
    appStateListeners.add(callback);
    return () => appStateListeners.delete(callback);
  },
  
  // 네비게이션
  goBack(): void {
    if (!isNativeApp()) {
      window.history.back();
      return;
    }
    postToNative({ type: 'GO_BACK' });
  },
  
  async canGoBack(): Promise<boolean> {
    if (!isNativeApp()) {
      return window.history.length > 1;
    }
    return callNative<boolean>('CAN_GO_BACK');
  },
};

// ==================== 유틸리티 함수 ====================

// 네이티브 앱 환경 체크
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  return !!(
    (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView ||
    (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: unknown } } }).webkit?.messageHandlers?.nativeBridge ||
    (window as unknown as { Android?: unknown }).Android
  );
}

// 플랫폼 확인
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'web';
}

// 웹 환경 디바이스 정보
function getWebDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  const platform = getPlatform();
  
  return {
    platform,
    version: platform === 'ios' 
      ? (ua.match(/OS (\d+_\d+)/) || ['', '0_0'])[1].replace('_', '.')
      : (ua.match(/Android (\d+\.?\d*)/) || ['', '0'])[1],
    model: platform === 'ios' ? 'iPhone/iPad' : 'Android Device',
    uniqueId: 'web-' + Math.random().toString(36).substr(2, 9),
    appVersion: '1.0.0',
    buildNumber: '1',
    isTablet: window.innerWidth >= 768,
    hasNotch: false,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    statusBarHeight: 0,
  };
}

// 딥링크 리스너 등록
export function onDeepLink(callback: (url: string) => void): () => void {
  deepLinkListeners.add(callback);
  return () => deepLinkListeners.delete(callback);
}

// 푸시 알림 리스너 등록
export function onPushNotification(callback: (data: Record<string, unknown>) => void): () => void {
  pushNotificationListeners.add(callback);
  return () => pushNotificationListeners.delete(callback);
}

// 딥링크 URL 파싱
export function parseDeepLink(url: string): {
  scheme: string;
  host: string;
  path: string;
  params: Record<string, string>;
} {
  try {
    // vibeolympics://marketplace/product/123?ref=share
    const match = url.match(/^(\w+):\/\/([^\/]+)?(\/[^?]*)?\??(.*)$/);
    
    if (!match) {
      return { scheme: '', host: '', path: '', params: {} };
    }
    
    const [, scheme, host = '', path = '', query = ''] = match;
    const params: Record<string, string> = {};
    
    if (query) {
      query.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }
    
    return { scheme, host, path, params };
  } catch {
    return { scheme: '', host: '', path: '', params: {} };
  }
}

// 딥링크 생성
export function createDeepLink(
  path: string,
  params?: Record<string, string>
): string {
  const scheme = 'vibeolympics';
  const host = 'app';
  
  let url = `${scheme}://${host}${path}`;
  
  if (params && Object.keys(params).length > 0) {
    const query = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${query}`;
  }
  
  return url;
}

// 유니버설 링크 생성 (웹 fallback 포함)
export function createUniversalLink(
  path: string,
  params?: Record<string, string>
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibe-olympics.onrender.com';
  
  let url = `${baseUrl}${path}`;
  
  if (params && Object.keys(params).length > 0) {
    const query = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${query}`;
  }
  
  return url;
}

// Safe Area Insets 가져오기
export function getSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10),
  };
}

// 전역 네이티브 메시지 핸들러 설정
export function setupNativeMessageHandler(): void {
  if (typeof window === 'undefined') return;
  
  // 글로벌 핸들러 등록
  (window as unknown as { handleNativeMessage: typeof handleNativeMessage }).handleNativeMessage = handleNativeMessage;
  
  // 메시지 이벤트 리스너 (대체 방식)
  window.addEventListener('message', (event) => {
    try {
      const message = typeof event.data === 'string' 
        ? JSON.parse(event.data) 
        : event.data;
      
      if (message && message.type) {
        handleNativeMessage(message);
      }
    } catch {
      // 파싱 실패 무시
    }
  });
}

// 자동 초기화
if (typeof window !== 'undefined') {
  setupNativeMessageHandler();
}
