/**
 * @fileoverview CSRF 토큰 시스템
 * Double Submit Cookie 패턴 구현
 *
 * 대응 위협: S1.2 (세션 하이재킹), S1.3 (CSRF 공격)
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { securityLogger } from './index';

// ============================================
// 1. 토큰 생성 및 검증
// ============================================
const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24시간

interface CSRFTokenData {
  token: string;
  expiresAt: number;
}

// 메모리 기반 토큰 저장소 (프로덕션에서는 Redis 권장)
const tokenStore = new Map<string, CSRFTokenData>();

export const csrf = {
  /**
   * 암호학적으로 안전한 CSRF 토큰 생성
   */
  generate: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * 토큰 유효성 검증
   */
  verify: (token: string, storedToken: string): boolean => {
    if (!token || !storedToken) return false;
    if (token.length !== storedToken.length) return false;

    // Timing-safe comparison
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }
    return result === 0;
  },

  /**
   * 세션용 토큰 생성 또는 기존 토큰 반환
   */
  getOrCreate: async (sessionId: string): Promise<string> => {
    const existing = tokenStore.get(sessionId);
    const now = Date.now();

    // 유효한 토큰이 있으면 반환
    if (existing && existing.expiresAt > now) {
      return existing.token;
    }

    // 새 토큰 생성
    const token = csrf.generate();
    tokenStore.set(sessionId, {
      token,
      expiresAt: now + TOKEN_EXPIRY_MS,
    });

    // 오래된 토큰 정리 (간단한 GC)
    if (tokenStore.size > 10000) {
      csrf.cleanup();
    }

    return token;
  },

  /**
   * 요청의 CSRF 토큰 검증
   */
  validateRequest: async (request: NextRequest, sessionId: string): Promise<boolean> => {
    // 안전한 메서드는 검증 스킵
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (safeMethod) return true;

    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value;

    // Double Submit Cookie 검증
    if (!headerToken || !cookieToken) {
      securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'high',
        details: {
          reason: 'CSRF token missing',
          hasHeader: !!headerToken,
          hasCookie: !!cookieToken,
          endpoint: request.nextUrl.pathname,
        },
        ...securityLogger.extractContext(request),
      });
      return false;
    }

    // 헤더와 쿠키 토큰 비교
    if (!csrf.verify(headerToken, cookieToken)) {
      securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'critical',
        details: {
          reason: 'CSRF token mismatch',
          endpoint: request.nextUrl.pathname,
        },
        ...securityLogger.extractContext(request),
      });
      return false;
    }

    // 저장된 토큰과 비교 (선택적 - 더 엄격한 검증)
    const stored = tokenStore.get(sessionId);
    if (stored && !csrf.verify(headerToken, stored.token)) {
      securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'critical',
        details: {
          reason: 'CSRF token not in store',
          endpoint: request.nextUrl.pathname,
        },
        ...securityLogger.extractContext(request),
      });
      return false;
    }

    return true;
  },

  /**
   * 응답에 CSRF 토큰 쿠키 설정
   */
  setTokenCookie: (response: NextResponse, token: string): NextResponse => {
    response.cookies.set(CSRF_TOKEN_NAME, token, {
      httpOnly: false, // JavaScript에서 읽을 수 있어야 함
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: TOKEN_EXPIRY_MS / 1000,
    });
    return response;
  },

  /**
   * 토큰 무효화 (로그아웃 시)
   */
  invalidate: (sessionId: string): void => {
    tokenStore.delete(sessionId);
  },

  /**
   * 만료된 토큰 정리
   */
  cleanup: (): void => {
    const now = Date.now();
    for (const [key, value] of tokenStore.entries()) {
      if (value.expiresAt < now) {
        tokenStore.delete(key);
      }
    }
  },
};

// ============================================
// 2. CSRF 미들웨어
// ============================================
export interface CSRFMiddlewareOptions {
  excludePaths?: string[];
  excludeMethods?: string[];
}

const defaultExcludePaths = [
  '/api/auth/', // NextAuth 라우트
  '/api/webhooks/', // Webhook 엔드포인트 (별도 시그니처 검증)
  '/api/health', // 헬스 체크
];

const defaultExcludeMethods = ['GET', 'HEAD', 'OPTIONS'];

export async function withCSRF(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CSRFMiddlewareOptions = {}
): Promise<NextResponse> {
  const { excludePaths = defaultExcludePaths, excludeMethods = defaultExcludeMethods } = options;
  const path = request.nextUrl.pathname;

  // 제외 경로 체크
  const isExcluded = excludePaths.some(excluded => path.startsWith(excluded));
  if (isExcluded) {
    return handler(request);
  }

  // 제외 메서드 체크
  if (excludeMethods.includes(request.method)) {
    return handler(request);
  }

  // 세션 ID 추출 (쿠키에서)
  const sessionId = request.cookies.get('next-auth.session-token')?.value
    || request.cookies.get('__Secure-next-auth.session-token')?.value
    || 'anonymous';

  // CSRF 검증
  const isValid = await csrf.validateRequest(request, sessionId);
  if (!isValid) {
    return new NextResponse(
      JSON.stringify({ error: 'CSRF 토큰이 유효하지 않습니다.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return handler(request);
}

// ============================================
// 3. 클라이언트용 헬퍼
// ============================================

/**
 * 클라이언트에서 CSRF 토큰을 가져와 헤더에 추가하는 헬퍼
 * 사용 예시:
 * ```typescript
 * const headers = getCSRFHeaders();
 * fetch('/api/endpoint', { headers, method: 'POST', ... });
 * ```
 */
export function getCSRFHeadersClient(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(c => c.trim().startsWith(`${CSRF_TOKEN_NAME}=`));

  if (!csrfCookie) return {};

  const token = csrfCookie.split('=')[1];
  return { [CSRF_HEADER_NAME]: token };
}

/**
 * API 클라이언트용 인터셉터
 * Axios, fetch 등에서 사용
 */
export const csrfInterceptor = {
  /**
   * 요청 인터셉터 - CSRF 토큰 추가
   */
  request: (config: RequestInit): RequestInit => {
    const headers = new Headers(config.headers);
    const csrfHeaders = getCSRFHeadersClient();

    Object.entries(csrfHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return { ...config, headers };
  },
};

export default csrf;
