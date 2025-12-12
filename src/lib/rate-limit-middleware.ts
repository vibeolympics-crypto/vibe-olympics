/**
 * Rate Limit Middleware for API Routes
 * API 라우트에 적용할 수 있는 Rate Limiting 래퍼
 * 
 * Session 80 - 운영 안정성 기능
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
  createRateLimitResponse,
  type RateLimitType,
} from './rate-limit';

type RouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<Response>;

interface WithRateLimitOptions {
  type?: RateLimitType;
  skipAuth?: boolean; // 인증된 사용자는 건너뛰기
  customIdentifier?: (request: NextRequest) => string | null;
}

/**
 * Rate Limit이 적용된 API 핸들러 래퍼
 * 
 * @example
 * // 기본 사용
 * export const GET = withRateLimit(async (req) => {
 *   return NextResponse.json({ data: 'success' });
 * });
 * 
 * // 옵션 지정
 * export const POST = withRateLimit(
 *   async (req) => {
 *     return NextResponse.json({ data: 'success' });
 *   },
 *   { type: 'auth', skipAuth: false }
 * );
 */
export function withRateLimit(
  handler: RouteHandler,
  options: WithRateLimitOptions = {}
): RouteHandler {
  const { type = 'default', skipAuth = false, customIdentifier } = options;

  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      // 식별자 결정 (커스텀 > 사용자 ID > IP)
      let identifier: string | null = null;
      
      if (customIdentifier) {
        identifier = customIdentifier(request);
      }
      
      if (!identifier && skipAuth) {
        // 인증된 사용자 확인
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          // 인증된 사용자는 Rate Limit 건너뛰기
          return handler(request, context);
        }
        identifier = getClientIP(request);
      } else {
        identifier = identifier || getClientIP(request);
      }

      // Rate Limit 체크
      const result = checkRateLimit(identifier, type);

      if (!result.allowed) {
        return createRateLimitResponse(result);
      }

      // 원래 핸들러 실행
      const response = await handler(request, context);

      // Rate Limit 헤더 추가
      const headers = new Headers(response.headers);
      const rateLimitHeaders = getRateLimitHeaders(result);
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // 에러가 발생해도 원래 핸들러는 실행
      return handler(request, context);
    }
  };
}

/**
 * 인증 API용 Rate Limit 래퍼 (더 엄격)
 */
export function withAuthRateLimit(handler: RouteHandler): RouteHandler {
  return withRateLimit(handler, { type: 'auth', skipAuth: false });
}

/**
 * 결제 API용 Rate Limit 래퍼
 */
export function withPaymentRateLimit(handler: RouteHandler): RouteHandler {
  return withRateLimit(handler, { type: 'payment', skipAuth: false });
}

/**
 * 검색 API용 Rate Limit 래퍼
 */
export function withSearchRateLimit(handler: RouteHandler): RouteHandler {
  return withRateLimit(handler, { type: 'search', skipAuth: true });
}

/**
 * 파일 업로드용 Rate Limit 래퍼
 */
export function withUploadRateLimit(handler: RouteHandler): RouteHandler {
  return withRateLimit(handler, { type: 'upload', skipAuth: false });
}

/**
 * 관리자 API용 Rate Limit 래퍼 (더 관대)
 */
export function withAdminRateLimit(handler: RouteHandler): RouteHandler {
  return withRateLimit(handler, { type: 'admin', skipAuth: true });
}
