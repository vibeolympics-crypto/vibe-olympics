/**
 * @fileoverview 통합 보안 시스템
 * 단일 모듈로 다중 위협 대응
 *
 * 대응 위협: S1.1, S1.3, S2.3, S2.4, S4.2, S4.4, S5.3, S6.2
 */

import { NextRequest, NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';

// ============================================
// 1. XSS 방어 (S2.3, S2.4)
// ============================================
export const sanitizer = {
  /**
   * HTML 콘텐츠 정화 (Stored XSS 방어)
   */
  html: (dirty: string): string => {
    if (!dirty || typeof dirty !== 'string') return '';
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  },

  /**
   * 일반 텍스트 정화 (Reflected XSS 방어)
   */
  text: (dirty: string): string => {
    if (!dirty || typeof dirty !== 'string') return '';
    return dirty
      .replace(/[<>]/g, '') // 기본 태그 제거
      .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
      .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
      .trim();
  },

  /**
   * URL 정화 (S4.4 SSRF 방어)
   */
  url: (url: string, allowedHosts?: string[]): string | null => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const defaultAllowed = [
        'vibeolympics.com',
        'localhost',
        'supabase.co',
        'cloudinary.com',
      ];
      const hosts = allowedHosts || defaultAllowed;

      // 프로토콜 검증
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }

      // 호스트 화이트리스트 검증
      const isAllowed = hosts.some(host =>
        parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );

      if (!isAllowed) {
        console.warn(`[Security] Blocked URL: ${url}`);
        return null;
      }

      return parsed.toString();
    } catch {
      return null;
    }
  },
};

// ============================================
// 2. Rate Limiting 강화 (S1.1, S4.2)
// ============================================
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked?: number }>();

export const rateLimit = {
  configs: {
    auth: { windowMs: 60000, maxRequests: 5, blockDurationMs: 300000 }, // 로그인: 1분 5회, 초과 시 5분 차단
    api: { windowMs: 60000, maxRequests: 100 }, // 일반 API: 1분 100회
    upload: { windowMs: 60000, maxRequests: 10 }, // 업로드: 1분 10회
    payment: { windowMs: 60000, maxRequests: 5 }, // 결제: 1분 5회
    sensitive: { windowMs: 60000, maxRequests: 3, blockDurationMs: 600000 }, // 민감 작업: 1분 3회
  } as Record<string, RateLimitConfig>,

  /**
   * Rate Limit 체크
   */
  check: (key: string, configName: keyof typeof rateLimit.configs): { allowed: boolean; remaining: number; resetIn: number } => {
    const config = rateLimit.configs[configName];
    const now = Date.now();
    const record = rateLimitStore.get(key);

    // 차단 상태 확인
    if (record?.blocked && record.blocked > now) {
      return { allowed: false, remaining: 0, resetIn: record.blocked - now };
    }

    // 윈도우 리셋
    if (!record || record.resetTime < now) {
      rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
      return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
    }

    // 카운트 증가
    record.count++;

    if (record.count > config.maxRequests) {
      // 차단 설정
      if (config.blockDurationMs) {
        record.blocked = now + config.blockDurationMs;
      }
      return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
    }

    return { allowed: true, remaining: config.maxRequests - record.count, resetIn: record.resetTime - now };
  },

  /**
   * Rate Limit 헤더 생성
   */
  headers: (result: { remaining: number; resetIn: number }): Headers => {
    const headers = new Headers();
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000).toString());
    return headers;
  },
};

// ============================================
// 3. 계정 보안 (S1.1, S1.3)
// ============================================
const loginAttemptStore = new Map<string, { attempts: number; lastAttempt: number; lockedUntil?: number }>();

export const accountSecurity = {
  MAX_ATTEMPTS: 5,
  LOCK_DURATION: 15 * 60 * 1000, // 15분
  ATTEMPT_WINDOW: 60 * 60 * 1000, // 1시간

  /**
   * 로그인 시도 기록 및 잠금 체크
   */
  checkLoginAttempt: (identifier: string): { allowed: boolean; attemptsRemaining: number; lockedUntil?: Date } => {
    const now = Date.now();
    const record = loginAttemptStore.get(identifier);

    // 잠금 상태 확인
    if (record?.lockedUntil && record.lockedUntil > now) {
      return {
        allowed: false,
        attemptsRemaining: 0,
        lockedUntil: new Date(record.lockedUntil)
      };
    }

    // 윈도우 만료 확인
    if (!record || (now - record.lastAttempt) > accountSecurity.ATTEMPT_WINDOW) {
      return { allowed: true, attemptsRemaining: accountSecurity.MAX_ATTEMPTS };
    }

    const attemptsRemaining = accountSecurity.MAX_ATTEMPTS - record.attempts;
    return { allowed: attemptsRemaining > 0, attemptsRemaining: Math.max(0, attemptsRemaining) };
  },

  /**
   * 로그인 실패 기록
   */
  recordFailedAttempt: (identifier: string): void => {
    const now = Date.now();
    const record = loginAttemptStore.get(identifier) || { attempts: 0, lastAttempt: now };

    record.attempts++;
    record.lastAttempt = now;

    if (record.attempts >= accountSecurity.MAX_ATTEMPTS) {
      record.lockedUntil = now + accountSecurity.LOCK_DURATION;
      console.warn(`[Security] Account locked: ${identifier.substring(0, 5)}***`);
    }

    loginAttemptStore.set(identifier, record);
  },

  /**
   * 로그인 성공 시 초기화
   */
  clearAttempts: (identifier: string): void => {
    loginAttemptStore.delete(identifier);
  },

  /**
   * 세션 고정 공격 방어 - 세션 ID 재생성 플래그
   */
  shouldRegenerateSession: true,
};

// ============================================
// 4. 민감 데이터 마스킹 (S5.3)
// ============================================
export const dataMasking = {
  patterns: {
    email: /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+)/g,
    phone: /(\d{3})[-.]?(\d{3,4})[-.]?(\d{4})/g,
    card: /(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})/g,
    password: /password["']?\s*[:=]\s*["']?([^"'\s,}]+)/gi,
    token: /(Bearer\s+)?([A-Za-z0-9_-]{20,})/g,
    apiKey: /(sk[-_]|pk[-_]|api[-_]?key)[A-Za-z0-9_-]{10,}/gi,
  },

  /**
   * 로그용 데이터 마스킹
   */
  forLogging: (data: unknown): unknown => {
    if (typeof data !== 'string' && typeof data !== 'object') return data;

    let str = typeof data === 'string' ? data : JSON.stringify(data);

    str = str.replace(dataMasking.patterns.email, '$1***@$2');
    str = str.replace(dataMasking.patterns.phone, '$1-****-$3');
    str = str.replace(dataMasking.patterns.card, '$1-****-****-$4');
    str = str.replace(dataMasking.patterns.password, 'password: [REDACTED]');
    str = str.replace(dataMasking.patterns.token, '[TOKEN_REDACTED]');
    str = str.replace(dataMasking.patterns.apiKey, '[API_KEY_REDACTED]');

    return typeof data === 'string' ? str : JSON.parse(str);
  },
};

// ============================================
// 5. 보안 이벤트 로깅 (감사 추적)
// ============================================
export type SecurityEventType =
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'ACCOUNT_LOCKED'
  | 'RATE_LIMIT_EXCEEDED' | 'XSS_ATTEMPT' | 'SSRF_ATTEMPT'
  | 'IDOR_ATTEMPT' | 'WEBHOOK_INVALID' | 'SUSPICIOUS_ACTIVITY';

interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export const securityLogger = {
  /**
   * 보안 이벤트 기록
   */
  log: (event: Omit<SecurityEvent, 'timestamp'>): void => {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      details: event.details ? dataMasking.forLogging(event.details) as Record<string, unknown> : undefined,
    };

    // 심각도에 따른 처리
    if (event.severity === 'critical' || event.severity === 'high') {
      console.error('[SECURITY_ALERT]', JSON.stringify(fullEvent));
      // TODO: 알림 시스템 연동 (Sentry, Slack 등)
    } else {
      console.warn('[SECURITY]', JSON.stringify(fullEvent));
    }
  },

  /**
   * Request에서 보안 컨텍스트 추출
   */
  extractContext: (request: NextRequest): { ip: string; userAgent: string } => {
    return {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };
  },
};

// ============================================
// 6. 보안 헤더 설정
// ============================================
export const securityHeaders = {
  /**
   * 응답에 보안 헤더 추가
   */
  apply: (response: NextResponse): NextResponse => {
    // XSS 방어
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Clickjacking 방어
    response.headers.set('X-Frame-Options', 'DENY');

    // MIME 스니핑 방지
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Referrer 정책
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // CSP (Content Security Policy) - 기본값, 필요시 조정
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    );

    return response;
  },
};

// ============================================
// 7. 통합 보안 미들웨어
// ============================================
export interface SecurityMiddlewareOptions {
  rateLimit?: keyof typeof rateLimit.configs;
  sanitizeBody?: boolean;
  checkAuth?: boolean;
  logEvent?: SecurityEventType;
}

export async function withSecurity(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
): Promise<NextResponse> {
  const context = securityLogger.extractContext(request);
  const identifier = context.ip;

  // 1. Rate Limit 체크
  if (options.rateLimit) {
    const result = rateLimit.check(identifier, options.rateLimit);
    if (!result.allowed) {
      securityLogger.log({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'medium',
        ip: context.ip,
        userAgent: context.userAgent,
        details: { endpoint: request.nextUrl.pathname, config: options.rateLimit },
      });

      return new NextResponse(
        JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
        {
          status: 429,
          headers: rateLimit.headers(result),
        }
      );
    }
  }

  // 2. 이벤트 로깅
  if (options.logEvent) {
    securityLogger.log({
      type: options.logEvent,
      severity: 'low',
      ip: context.ip,
      userAgent: context.userAgent,
      details: { endpoint: request.nextUrl.pathname },
    });
  }

  // 3. 핸들러 실행
  try {
    const response = await handler(request);
    return securityHeaders.apply(response);
  } catch (error) {
    securityLogger.log({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'high',
      ip: context.ip,
      userAgent: context.userAgent,
      details: {
        endpoint: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

export default {
  sanitizer,
  rateLimit,
  accountSecurity,
  dataMasking,
  securityLogger,
  securityHeaders,
  withSecurity,
};
