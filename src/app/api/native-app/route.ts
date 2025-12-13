/**
 * 네이티브 앱 웹뷰 상태 체크 API
 * - 앱 버전 확인
 * - 기능 호환성 체크
 * - 딥링크 처리
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 앱 최소 버전 정보
const MIN_APP_VERSIONS = {
  ios: '1.0.0',
  android: '1.0.0',
};

// 기능별 최소 버전
const FEATURE_VERSIONS = {
  pushNotification: { ios: '1.0.0', android: '1.0.0' },
  biometricAuth: { ios: '1.1.0', android: '1.1.0' },
  shareContent: { ios: '1.0.0', android: '1.0.0' },
  deepLink: { ios: '1.0.0', android: '1.0.0' },
  inAppPurchase: { ios: '1.2.0', android: '1.2.0' },
};

// 버전 비교
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  
  return 0;
}

// GET: 앱 정보 및 호환성 체크
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'info';
  const platform = (searchParams.get('platform') || 'web') as 'ios' | 'android' | 'web';
  const appVersion = searchParams.get('version') || '0.0.0';

  switch (type) {
    // 앱 기본 정보
    case 'info': {
      return NextResponse.json({
        app: {
          name: 'Vibe Olympics',
          bundleId: {
            ios: 'com.vibeolympics.app',
            android: 'com.vibeolympics.app',
          },
          minVersion: MIN_APP_VERSIONS,
          currentVersion: {
            ios: '1.0.0',
            android: '1.0.0',
          },
          storeUrl: {
            ios: 'https://apps.apple.com/app/vibe-olympics/id123456789',
            android: 'https://play.google.com/store/apps/details?id=com.vibeolympics.app',
          },
        },
        webUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://vibe-olympics.onrender.com',
        apiVersion: '1.0',
      });
    }

    // 버전 호환성 체크
    case 'compatibility': {
      if (platform === 'web') {
        return NextResponse.json({
          compatible: true,
          platform: 'web',
          features: [],
        });
      }

      const minVersion = MIN_APP_VERSIONS[platform];
      const isCompatible = compareVersions(appVersion, minVersion) >= 0;
      
      // 지원되는 기능 확인
      const features: Record<string, boolean> = {};
      for (const [feature, versions] of Object.entries(FEATURE_VERSIONS)) {
        const requiredVersion = versions[platform];
        features[feature] = compareVersions(appVersion, requiredVersion) >= 0;
      }

      return NextResponse.json({
        compatible: isCompatible,
        platform,
        currentVersion: appVersion,
        minVersion,
        updateRequired: !isCompatible,
        features,
        storeUrl: platform === 'ios'
          ? 'https://apps.apple.com/app/vibe-olympics/id123456789'
          : 'https://play.google.com/store/apps/details?id=com.vibeolympics.app',
      });
    }

    // 딥링크 라우팅 정보
    case 'deep-links': {
      const deepLinks = [
        {
          path: '/product/:id',
          pattern: 'vibeolympics://marketplace/product/:id',
          webPath: '/marketplace/:id',
          description: '상품 상세 페이지',
        },
        {
          path: '/artist/:id',
          pattern: 'vibeolympics://artists/:id',
          webPath: '/artists/:id',
          description: '아티스트 프로필',
        },
        {
          path: '/post/:id',
          pattern: 'vibeolympics://community/post/:id',
          webPath: '/community?post=:id',
          description: '커뮤니티 게시글',
        },
        {
          path: '/tutorial/:id',
          pattern: 'vibeolympics://education/tutorial/:id',
          webPath: '/education/tutorials/:id',
          description: '튜토리얼',
        },
        {
          path: '/dashboard',
          pattern: 'vibeolympics://dashboard',
          webPath: '/dashboard',
          description: '대시보드',
        },
        {
          path: '/cart',
          pattern: 'vibeolympics://cart',
          webPath: '/marketplace/cart',
          description: '장바구니',
        },
        {
          path: '/notifications',
          pattern: 'vibeolympics://notifications',
          webPath: '/dashboard/notifications',
          description: '알림 목록',
        },
        {
          path: '/settings',
          pattern: 'vibeolympics://settings',
          webPath: '/dashboard/settings',
          description: '설정',
        },
      ];

      return NextResponse.json({ deepLinks });
    }

    // 웹뷰 설정
    case 'webview-config': {
      return NextResponse.json({
        config: {
          // 기본 URL
          baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://vibe-olympics.onrender.com',
          
          // 사용자 에이전트
          userAgent: {
            ios: 'VibeOlympics/1.0 (iOS; WebView)',
            android: 'VibeOlympics/1.0 (Android; WebView)',
          },
          
          // JavaScript 인젝션 스크립트
          injectedScript: `
            // Safe Area Insets 설정
            document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
            document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');
            document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');
            
            // 네이티브 앱 표시
            document.documentElement.classList.add('native-app');
            
            // 브릿지 초기화 확인
            console.log('[WebView] Native bridge initialized');
          `,
          
          // 허용된 URL 패턴
          allowedUrlPatterns: [
            'https://vibe-olympics.onrender.com/*',
            'https://*.vibe-olympics.com/*',
          ],
          
          // 외부 브라우저로 열 URL 패턴
          externalUrlPatterns: [
            'https://www.paypal.com/*',
            'https://pay.toss.im/*',
            'https://checkout.stripe.com/*',
            'tel:*',
            'mailto:*',
          ],
          
          // 캐시 정책
          cachePolicy: {
            enabled: true,
            maxAge: 86400, // 1일
            excludePaths: ['/api/*', '/dashboard/*'],
          },
          
          // 오프라인 모드
          offlineMode: {
            enabled: true,
            fallbackPage: '/offline.html',
            cachePaths: ['/', '/marketplace', '/community', '/education'],
          },
        },
      });
    }

    // 푸시 알림 설정
    case 'push-config': {
      return NextResponse.json({
        enabled: true,
        topics: [
          { id: 'all', name: '전체 알림', description: '모든 알림 수신' },
          { id: 'sales', name: '판매 알림', description: '판매 관련 알림' },
          { id: 'marketing', name: '마케팅', description: '이벤트 및 프로모션' },
          { id: 'community', name: '커뮤니티', description: '댓글, 좋아요 알림' },
        ],
        channels: {
          android: [
            {
              id: 'default',
              name: '기본 알림',
              importance: 'high',
              sound: 'default',
            },
            {
              id: 'sales',
              name: '판매 알림',
              importance: 'high',
              sound: 'sale.mp3',
            },
            {
              id: 'marketing',
              name: '마케팅 알림',
              importance: 'default',
              sound: 'default',
            },
          ],
        },
        ios: {
          sound: true,
          badge: true,
          alert: true,
          provisional: true,
        },
      });
    }

    default:
      return NextResponse.json(
        { error: '지원하지 않는 타입입니다.' },
        { status: 400 }
      );
  }
}

// POST: 앱 이벤트 로깅
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      // 앱 설치/실행 이벤트
      case 'app-event': {
        const { event, platform, version, deviceId, data } = body as {
          event: string;
          platform: string;
          version: string;
          deviceId: string;
          data?: Record<string, unknown>;
        };

        // 실제로는 분석 서비스에 전송
        console.log('[Native App Event]', {
          event,
          platform,
          version,
          deviceId,
          data,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
      }

      // 푸시 토큰 등록
      case 'register-push-token': {
        const { token, platform, deviceId, userId } = body as {
          token: string;
          platform: string;
          deviceId: string;
          userId?: string;
        };

        // 실제로는 DB에 저장
        console.log('[Push Token Registration]', {
          token: token.substring(0, 20) + '...',
          platform,
          deviceId,
          userId,
        });

        return NextResponse.json({ success: true, registered: true });
      }

      // 딥링크 처리 결과
      case 'deep-link-handled': {
        const { url, handled, destination } = body as {
          url: string;
          handled: boolean;
          destination?: string;
        };

        console.log('[Deep Link Handled]', { url, handled, destination });

        return NextResponse.json({ success: true });
      }

      // 에러 리포트
      case 'error-report': {
        const { error, stack, platform, version, deviceId } = body as {
          error: string;
          stack?: string;
          platform: string;
          version: string;
          deviceId: string;
        };

        console.error('[Native App Error]', {
          error,
          stack,
          platform,
          version,
          deviceId,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, reported: true });
      }

      default:
        return NextResponse.json(
          { error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Native app API error:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
