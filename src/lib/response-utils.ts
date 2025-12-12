/**
 * HTTP 응답 최적화 유틸리티
 * - 캐시 헤더 설정
 * - 압축 설정
 * - ETag 생성
 */

import { NextResponse } from "next/server";
import { createHash } from "crypto";

// ============================================
// 캐시 헤더 설정
// ============================================

export interface CacheHeaders {
  maxAge?: number;        // 초 단위
  sMaxAge?: number;       // CDN 캐시 (초 단위)
  staleWhileRevalidate?: number;  // 백그라운드 재검증 (초 단위)
  private?: boolean;      // private 캐시
  noStore?: boolean;      // 캐시 금지
  mustRevalidate?: boolean;
}

/**
 * Cache-Control 헤더 생성
 */
export function createCacheControl(options: CacheHeaders): string {
  const directives: string[] = [];
  
  if (options.noStore) {
    return 'no-store, no-cache, must-revalidate';
  }
  
  if (options.private) {
    directives.push('private');
  } else {
    directives.push('public');
  }
  
  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`);
  }
  
  if (options.sMaxAge !== undefined) {
    directives.push(`s-maxage=${options.sMaxAge}`);
  }
  
  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  
  if (options.mustRevalidate) {
    directives.push('must-revalidate');
  }
  
  return directives.join(', ');
}

/**
 * 캐시 프리셋
 */
export const CACHE_PRESETS = {
  // 정적 콘텐츠 (이미지, 폰트 등)
  STATIC: {
    maxAge: 31536000,  // 1년
    sMaxAge: 31536000,
  },
  
  // 변경 가능한 정적 콘텐츠
  IMMUTABLE: {
    maxAge: 31536000,
    sMaxAge: 31536000,
  },
  
  // 공개 API (카테고리, 상품 목록 등)
  PUBLIC_API: {
    maxAge: 60,         // 1분
    sMaxAge: 300,       // CDN 5분
    staleWhileRevalidate: 600,  // 10분 백그라운드 재검증
  },
  
  // 개인 API (대시보드, 프로필 등)
  PRIVATE_API: {
    private: true,
    maxAge: 0,
    mustRevalidate: true,
  },
  
  // 실시간 데이터 (알림, 채팅 등)
  REALTIME: {
    noStore: true,
  },
  
  // 짧은 캐시 (검색 결과 등)
  SHORT: {
    maxAge: 30,
    sMaxAge: 60,
    staleWhileRevalidate: 120,
  },
  
  // 중간 캐시 (상품 상세 등)
  MEDIUM: {
    maxAge: 300,        // 5분
    sMaxAge: 600,       // CDN 10분
    staleWhileRevalidate: 1800,  // 30분
  },
  
  // 긴 캐시 (정적 페이지 등)
  LONG: {
    maxAge: 3600,       // 1시간
    sMaxAge: 86400,     // CDN 24시간
    staleWhileRevalidate: 86400,
  },
} as const;

// ============================================
// ETag 생성
// ============================================

/**
 * ETag 생성 (데이터 해시)
 */
export function generateETag(data: unknown): string {
  const hash = createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
  return `"${hash}"`;
}

/**
 * 약한 ETag 생성 (타임스탬프 기반)
 */
export function generateWeakETag(timestamp: Date | number): string {
  const ts = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  return `W/"${ts.toString(36)}"`;
}

// ============================================
// 응답 헬퍼
// ============================================

/**
 * 캐시 헤더가 포함된 JSON 응답 생성
 */
export function jsonResponseWithCache<T>(
  data: T,
  cacheOptions: CacheHeaders = CACHE_PRESETS.PUBLIC_API,
  status: number = 200
): NextResponse<T> {
  const response = NextResponse.json(data, { status });
  
  // Cache-Control 헤더 설정
  response.headers.set('Cache-Control', createCacheControl(cacheOptions));
  
  // ETag 헤더 설정
  response.headers.set('ETag', generateETag(data));
  
  return response;
}

/**
 * 스트리밍 응답 헬퍼 (대용량 데이터)
 */
export function streamResponse(
  data: AsyncIterable<unknown>,
  headers?: Record<string, string>
): Response {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of data) {
        controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
      }
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      ...headers,
    },
  });
}

// ============================================
// 조건부 요청 처리
// ============================================

/**
 * If-None-Match 헤더 확인 (304 응답 지원)
 */
export function checkConditionalRequest(
  request: Request,
  currentETag: string
): boolean {
  const ifNoneMatch = request.headers.get('If-None-Match');
  
  if (ifNoneMatch && ifNoneMatch === currentETag) {
    return true; // 304 Not Modified 응답 필요
  }
  
  return false;
}

/**
 * 304 Not Modified 응답 생성
 */
export function notModifiedResponse(etag: string): NextResponse {
  return new NextResponse(null, {
    status: 304,
    headers: {
      'ETag': etag,
    },
  });
}

// ============================================
// 응답 크기 최적화
// ============================================

/**
 * 불필요한 필드 제거
 */
export function stripSensitiveFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToRemove: string[]
): Partial<T> {
  const result = { ...data };
  
  for (const field of fieldsToRemove) {
    delete result[field];
  }
  
  return result;
}

/**
 * 필요한 필드만 선택
 */
export function pickFields<T extends Record<string, unknown>, K extends keyof T>(
  data: T,
  fields: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  
  for (const field of fields) {
    if (field in data) {
      result[field] = data[field];
    }
  }
  
  return result;
}

/**
 * null 값 제거 (응답 크기 최적화)
 */
export function removeNullValues<T extends Record<string, unknown>>(data: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  
  return result;
}
