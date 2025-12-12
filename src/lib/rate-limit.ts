/**
 * Rate Limiting Utility
 * API 호출 속도 제한을 위한 유틸리티
 * 
 * Session 80 - 운영 안정성 기능
 */

// 메모리 기반 Rate Limiter (서버리스 환경에서는 Redis 권장)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// IP별 요청 기록 저장
const rateLimitStore = new Map<string, RateLimitEntry>();

// 설정 상수
export const RATE_LIMIT_CONFIG = {
  // 일반 API (분당)
  default: {
    windowMs: 60 * 1000, // 1분
    maxRequests: 60, // 분당 60회
  },
  // 인증 API (더 엄격)
  auth: {
    windowMs: 60 * 1000,
    maxRequests: 10, // 분당 10회
  },
  // 결제 API
  payment: {
    windowMs: 60 * 1000,
    maxRequests: 20, // 분당 20회
  },
  // 검색 API
  search: {
    windowMs: 60 * 1000,
    maxRequests: 30, // 분당 30회
  },
  // 파일 업로드
  upload: {
    windowMs: 60 * 1000,
    maxRequests: 10, // 분당 10회
  },
  // 관리자 API (더 관대)
  admin: {
    windowMs: 60 * 1000,
    maxRequests: 120, // 분당 120회
  },
};

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

/**
 * Rate Limit 체크
 * @param identifier - IP 주소 또는 사용자 ID
 * @param type - Rate limit 타입
 * @returns 허용 여부와 남은 요청 수
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'default'
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const config = RATE_LIMIT_CONFIG[type];
  const now = Date.now();
  const key = `${type}:${identifier}`;
  
  // 기존 기록 조회
  let entry = rateLimitStore.get(key);
  
  // 윈도우가 만료되었거나 기록이 없으면 초기화
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  // 요청 수 증가
  entry.count++;
  rateLimitStore.set(key, entry);
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;
  
  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Rate Limit 초기화 (테스트용)
 */
export function resetRateLimit(identifier: string, type: RateLimitType = 'default'): void {
  const key = `${type}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * 모든 Rate Limit 초기화 (테스트용)
 */
export function resetAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Rate Limit 상태 조회
 */
export function getRateLimitStatus(
  identifier: string,
  type: RateLimitType = 'default'
): {
  count: number;
  maxRequests: number;
  windowMs: number;
  resetTime: number | null;
} {
  const config = RATE_LIMIT_CONFIG[type];
  const key = `${type}:${identifier}`;
  const entry = rateLimitStore.get(key);
  
  return {
    count: entry?.count || 0,
    maxRequests: config.maxRequests,
    windowMs: config.windowMs,
    resetTime: entry?.resetTime || null,
  };
}

/**
 * IP 주소 추출 (프록시 뒤에서도 동작)
 */
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare 등 프록시 환경
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Cloudflare
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }
  
  // 직접 연결
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Rate Limit 응답 헤더 생성
 */
export function getRateLimitHeaders(result: ReturnType<typeof checkRateLimit>): Record<string, string> {
  return {
    'X-RateLimit-Limit': RATE_LIMIT_CONFIG.default.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  };
}

/**
 * Rate Limit 에러 응답 생성
 */
export function createRateLimitResponse(result: ReturnType<typeof checkRateLimit>): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(result),
      },
    }
  );
}

// 만료된 엔트리 정리 (메모리 관리)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // 1분마다 정리
