/**
 * 캐싱 유틸리티
 * - 메모리 캐시 (단기)
 * - Redis 대체 인메모리 캐시
 * - 캐시 무효화 전략
 */

// 캐시 항목 타입
interface CacheEntry<T> {
  data: T;
  expiry: number;
  tags: string[];
}

// 전역 캐시 스토어
const cacheStore = new Map<string, CacheEntry<unknown>>();

// 캐시 설정
const DEFAULT_TTL = 60 * 1000; // 1분 (밀리초)
const MAX_CACHE_SIZE = 1000;

/**
 * 캐시에서 데이터 가져오기
 */
export function getCache<T>(key: string): T | null {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
  
  if (!entry) {
    return null;
  }
  
  // 만료 확인
  if (Date.now() > entry.expiry) {
    cacheStore.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * 캐시에 데이터 저장
 */
export function setCache<T>(
  key: string, 
  data: T, 
  ttl: number = DEFAULT_TTL,
  tags: string[] = []
): void {
  // 캐시 크기 제한
  if (cacheStore.size >= MAX_CACHE_SIZE) {
    // 가장 오래된 항목 삭제
    const firstKey = cacheStore.keys().next().value;
    if (firstKey) {
      cacheStore.delete(firstKey);
    }
  }
  
  cacheStore.set(key, {
    data,
    expiry: Date.now() + ttl,
    tags,
  });
}

/**
 * 캐시에서 데이터 삭제
 */
export function deleteCache(key: string): void {
  cacheStore.delete(key);
}

/**
 * 태그로 캐시 무효화
 */
export function invalidateCacheByTag(tag: string): void {
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.tags.includes(tag)) {
      cacheStore.delete(key);
    }
  }
}

/**
 * 패턴으로 캐시 무효화 (와일드카드 지원)
 */
export function invalidateCacheByPattern(pattern: string): void {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  
  for (const key of cacheStore.keys()) {
    if (regex.test(key)) {
      cacheStore.delete(key);
    }
  }
}

/**
 * 전체 캐시 클리어
 */
export function clearCache(): void {
  cacheStore.clear();
}

/**
 * 캐시 통계
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
  memoryUsage: string;
} {
  return {
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys()),
    memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  };
}

/**
 * 캐시 미들웨어 래퍼
 * - 캐시 히트 시 캐시된 데이터 반환
 * - 캐시 미스 시 함수 실행 후 캐시에 저장
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, tags = [], forceRefresh = false } = options;
  
  // 강제 새로고침이 아니면 캐시 확인
  if (!forceRefresh) {
    const cached = getCache<T>(key);
    if (cached !== null) {
      return cached;
    }
  }
  
  // 함수 실행 및 캐시 저장
  const result = await fn();
  setCache(key, result, ttl, tags);
  
  return result;
}

// ============================================
// 캐시 키 생성 헬퍼
// ============================================

/**
 * API 캐시 키 생성
 */
export function apiCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `api:${endpoint}:${paramStr}`;
}

/**
 * 사용자별 캐시 키 생성
 */
export function userCacheKey(userId: string, resource: string): string {
  return `user:${userId}:${resource}`;
}

/**
 * 상품별 캐시 키 생성
 */
export function productCacheKey(productId: string, resource?: string): string {
  return resource ? `product:${productId}:${resource}` : `product:${productId}`;
}

// ============================================
// 캐시 TTL 상수
// ============================================

export const CACHE_TTL = {
  SHORT: 30 * 1000,        // 30초
  MEDIUM: 5 * 60 * 1000,   // 5분
  LONG: 30 * 60 * 1000,    // 30분
  HOUR: 60 * 60 * 1000,    // 1시간
  DAY: 24 * 60 * 60 * 1000, // 24시간
} as const;

// ============================================
// 캐시 태그 상수
// ============================================

export const CACHE_TAGS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  USERS: 'users',
  PURCHASES: 'purchases',
  REVIEWS: 'reviews',
  TUTORIALS: 'tutorials',
  POSTS: 'posts',
  RECOMMENDATIONS: 'recommendations',
} as const;
