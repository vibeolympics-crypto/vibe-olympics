'use client';

/**
 * 네이티브 앱 전용 컴포넌트 및 훅
 * - 네이티브 앱 환경 감지
 * - 네이티브 기능 래퍼
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  nativeBridge,
  isNativeApp,
  getPlatform,
  onDeepLink,
  onPushNotification,
  parseDeepLink,
  DeviceInfo,
  AppState,
} from '@/lib/webview-bridge';
import { useRouter } from 'next/navigation';

// ==================== Context ====================

interface NativeAppContextType {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  deviceInfo: DeviceInfo | null;
  appState: AppState;
  pushToken: string | null;
  
  // 네이티브 기능
  share: (content: { title?: string; message: string; url?: string }) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<boolean>;
  vibrate: (pattern?: number[]) => void;
  openUrl: (url: string) => Promise<boolean>;
  goBack: () => void;
  canGoBack: () => Promise<boolean>;
  
  // 알림
  requestNotificationPermission: () => Promise<boolean>;
  
  // 생체 인증
  authenticateWithBiometrics: () => Promise<boolean>;
}

const NativeAppContext = createContext<NativeAppContextType | null>(null);

// ==================== Provider ====================

interface NativeAppProviderProps {
  children: ReactNode;
  onDeepLinkReceived?: (path: string, params: Record<string, string>) => void;
  onPushReceived?: (data: Record<string, unknown>) => void;
}

export function NativeAppProvider({
  children,
  onDeepLinkReceived,
  onPushReceived,
}: NativeAppProviderProps) {
  const router = useRouter();
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [appState, setAppState] = useState<AppState>('active');
  const [pushToken, setPushToken] = useState<string | null>(null);

  // 초기화
  useEffect(() => {
    const native = isNativeApp();
    setIsNative(native);
    setPlatform(getPlatform());

    // 디바이스 정보 로드
    nativeBridge.getDeviceInfo().then(setDeviceInfo);

    // 푸시 토큰 로드
    if (native) {
      nativeBridge.getPushToken().then(setPushToken);
    }
  }, []);

  // 앱 상태 변화 리스너
  useEffect(() => {
    const unsubscribe = nativeBridge.onAppStateChange(setAppState);
    return unsubscribe;
  }, []);

  // 딥링크 리스너
  useEffect(() => {
    const unsubscribe = onDeepLink((url) => {
      const { path, params } = parseDeepLink(url);
      
      if (onDeepLinkReceived) {
        onDeepLinkReceived(path, params);
      } else {
        // 기본 라우팅
        handleDeepLinkNavigation(path, params);
      }
    });
    return unsubscribe;
  }, [onDeepLinkReceived]);

  // 푸시 알림 리스너
  useEffect(() => {
    const unsubscribe = onPushNotification((data) => {
      if (onPushReceived) {
        onPushReceived(data);
      }
    });
    return unsubscribe;
  }, [onPushReceived]);

  // 딥링크 네비게이션
  const handleDeepLinkNavigation = useCallback((path: string, params: Record<string, string>) => {
    const routes: Record<string, string> = {
      '/product': '/marketplace',
      '/artist': '/artists',
      '/post': '/community',
      '/tutorial': '/education/tutorials',
    };

    // 경로 변환
    let webPath = path;
    for (const [pattern, replacement] of Object.entries(routes)) {
      if (path.startsWith(pattern)) {
        webPath = path.replace(pattern, replacement);
        break;
      }
    }

    // 파라미터 추가
    if (Object.keys(params).length > 0) {
      const query = new URLSearchParams(params).toString();
      webPath += `?${query}`;
    }

    router.push(webPath);
  }, [router]);

  // 공유
  const share = useCallback(async (content: { title?: string; message: string; url?: string }) => {
    return nativeBridge.shareContent(content);
  }, []);

  // 클립보드 복사
  const copyToClipboard = useCallback(async (text: string) => {
    return nativeBridge.copyToClipboard(text);
  }, []);

  // 진동
  const vibrate = useCallback((pattern?: number[]) => {
    nativeBridge.vibrate(pattern);
  }, []);

  // 외부 URL 열기
  const openUrl = useCallback(async (url: string) => {
    return nativeBridge.openExternalUrl(url);
  }, []);

  // 뒤로가기
  const goBack = useCallback(() => {
    nativeBridge.goBack();
  }, []);

  // 뒤로갈 수 있는지 확인
  const canGoBack = useCallback(async () => {
    return nativeBridge.canGoBack();
  }, []);

  // 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    return nativeBridge.requestNotificationPermission();
  }, []);

  // 생체 인증
  const authenticateWithBiometrics = useCallback(async () => {
    const result = await nativeBridge.getBiometricAuth();
    return result.authenticated;
  }, []);

  const value: NativeAppContextType = {
    isNative,
    platform,
    deviceInfo,
    appState,
    pushToken,
    share,
    copyToClipboard,
    vibrate,
    openUrl,
    goBack,
    canGoBack,
    requestNotificationPermission,
    authenticateWithBiometrics,
  };

  return (
    <NativeAppContext.Provider value={value}>
      {children}
    </NativeAppContext.Provider>
  );
}

// ==================== Hooks ====================

export function useNativeApp() {
  const context = useContext(NativeAppContext);
  if (!context) {
    throw new Error('useNativeApp must be used within NativeAppProvider');
  }
  return context;
}

// 플랫폼별 조건부 렌더링 훅
export function usePlatform() {
  const { platform, isNative } = useNativeApp();
  
  return {
    platform,
    isNative,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web' && !isNative,
  };
}

// 앱 상태 훅
export function useAppState() {
  const { appState } = useNativeApp();
  
  return {
    appState,
    isActive: appState === 'active',
    isBackground: appState === 'background',
    isInactive: appState === 'inactive',
  };
}

// ==================== 컴포넌트 ====================

// 네이티브 앱에서만 렌더링
export function NativeOnly({ children }: { children: ReactNode }) {
  const { isNative } = useNativeApp();
  
  if (!isNative) return null;
  return <>{children}</>;
}

// 웹에서만 렌더링
export function WebOnly({ children }: { children: ReactNode }) {
  const { isNative } = useNativeApp();
  
  if (isNative) return null;
  return <>{children}</>;
}

// iOS에서만 렌더링
export function IOSOnly({ children }: { children: ReactNode }) {
  const { platform } = usePlatform();
  
  if (platform !== 'ios') return null;
  return <>{children}</>;
}

// Android에서만 렌더링
export function AndroidOnly({ children }: { children: ReactNode }) {
  const { platform } = usePlatform();
  
  if (platform !== 'android') return null;
  return <>{children}</>;
}

// Safe Area Wrapper
export function SafeAreaView({
  children,
  className = '',
  edges = ['top', 'bottom'],
}: {
  children: ReactNode;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const { isNative } = useNativeApp();
  
  if (!isNative) {
    return <div className={className}>{children}</div>;
  }
  
  const style: React.CSSProperties = {};
  
  if (edges.includes('top')) {
    style.paddingTop = 'env(safe-area-inset-top)';
  }
  if (edges.includes('bottom')) {
    style.paddingBottom = 'env(safe-area-inset-bottom)';
  }
  if (edges.includes('left')) {
    style.paddingLeft = 'env(safe-area-inset-left)';
  }
  if (edges.includes('right')) {
    style.paddingRight = 'env(safe-area-inset-right)';
  }
  
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

// 네이티브 백버튼 핸들러
export function useBackHandler(handler: () => boolean) {
  const { isNative, platform } = useNativeApp();
  
  useEffect(() => {
    if (!isNative || platform !== 'android') return;
    
    const handleBackPress = (event: PopStateEvent) => {
      const shouldPrevent = handler();
      if (shouldPrevent) {
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
      }
    };
    
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleBackPress);
    
    return () => {
      window.removeEventListener('popstate', handleBackPress);
    };
  }, [isNative, platform, handler]);
}

// 공유 버튼 컴포넌트
export function ShareButton({
  title,
  message,
  url,
  className = '',
  children,
}: {
  title?: string;
  message: string;
  url?: string;
  className?: string;
  children: ReactNode;
}) {
  const { share, vibrate } = useNativeApp();
  
  const handleShare = async () => {
    vibrate([50]);
    await share({ title, message, url });
  };
  
  return (
    <button onClick={handleShare} className={className}>
      {children}
    </button>
  );
}

// 앱 스토어 링크 컴포넌트
export function AppStoreLink({
  className = '',
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { platform, openUrl } = useNativeApp();
  
  const handleClick = () => {
    const url = platform === 'ios'
      ? 'https://apps.apple.com/app/vibe-olympics/id123456789'
      : 'https://play.google.com/store/apps/details?id=com.vibeolympics.app';
    
    openUrl(url);
  };
  
  return (
    <button onClick={handleClick} className={className}>
      {children || (platform === 'ios' ? 'App Store에서 보기' : 'Play Store에서 보기')}
    </button>
  );
}

// 앱 업데이트 배너
export function UpdateBanner({
  currentVersion,
  latestVersion,
  onDismiss,
}: {
  currentVersion: string;
  latestVersion: string;
  onDismiss?: () => void;
}) {
  const { isNative, platform, openUrl } = useNativeApp();
  
  if (!isNative || currentVersion >= latestVersion) return null;
  
  const handleUpdate = () => {
    const url = platform === 'ios'
      ? 'https://apps.apple.com/app/vibe-olympics/id123456789'
      : 'https://play.google.com/store/apps/details?id=com.vibeolympics.app';
    
    openUrl(url);
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground p-3 flex items-center justify-between z-50 safe-area-top">
      <div>
        <p className="font-medium">새 버전이 출시되었습니다</p>
        <p className="text-sm opacity-80">v{latestVersion}</p>
      </div>
      <div className="flex gap-2">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-3 py-1 rounded text-sm opacity-80 hover:opacity-100"
          >
            나중에
          </button>
        )}
        <button
          onClick={handleUpdate}
          className="px-3 py-1 bg-white text-primary rounded text-sm font-medium"
        >
          업데이트
        </button>
      </div>
    </div>
  );
}

export default NativeAppProvider;
