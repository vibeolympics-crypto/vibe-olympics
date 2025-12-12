/**
 * 쿼리 최적화 유틸리티
 * - Prisma 쿼리 최적화 헬퍼
 * - 페이지네이션 표준화
 * - 정렬 표준화
 * - 필터링 헬퍼
 */

import { Prisma } from "@prisma/client";

// ============================================
// 페이지네이션
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

/**
 * 페이지네이션 파라미터 파싱
 */
export function parsePagination(params: PaginationParams): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;
  
  return { skip, take: limit, page, limit };
}

/**
 * 페이지네이션 결과 포맷
 */
export function formatPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

// ============================================
// 정렬
// ============================================

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

/**
 * 정렬 파라미터 파싱
 */
export function parseSort(
  params: SortParams,
  allowedFields: string[],
  defaultField: string = 'createdAt',
  defaultOrder: SortOrder = 'desc'
): { orderBy: Record<string, SortOrder> } {
  const sortBy = params.sortBy && allowedFields.includes(params.sortBy) 
    ? params.sortBy 
    : defaultField;
  const sortOrder = params.sortOrder === 'asc' ? 'asc' : defaultOrder;
  
  return { orderBy: { [sortBy]: sortOrder } };
}

// ============================================
// 필터링
// ============================================

/**
 * 날짜 범위 필터 생성
 */
export function dateRangeFilter(
  startDate?: Date | string,
  endDate?: Date | string
): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) return undefined;
  
  const filter: Prisma.DateTimeFilter = {};
  
  if (startDate) {
    filter.gte = new Date(startDate);
  }
  
  if (endDate) {
    filter.lte = new Date(endDate);
  }
  
  return filter;
}

/**
 * 가격 범위 필터 생성
 */
export function priceRangeFilter(
  minPrice?: number,
  maxPrice?: number
): Prisma.DecimalFilter | undefined {
  if (minPrice === undefined && maxPrice === undefined) return undefined;
  
  const filter: Prisma.DecimalFilter = {};
  
  if (minPrice !== undefined) {
    filter.gte = minPrice;
  }
  
  if (maxPrice !== undefined) {
    filter.lte = maxPrice;
  }
  
  return filter;
}

/**
 * 검색 필터 생성 (다중 필드)
 */
export function searchFilter(
  query: string,
  fields: string[]
): Prisma.StringFilter | { OR: Record<string, Prisma.StringFilter>[] } {
  if (!query || fields.length === 0) {
    return {};
  }
  
  const searchConditions = fields.map(field => ({
    [field]: {
      contains: query,
      mode: 'insensitive' as const,
    },
  }));
  
  return { OR: searchConditions };
}

// ============================================
// 셀렉트 최적화
// ============================================

/**
 * 상품 목록용 최소 셀렉트
 */
export const productListSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  thumbnail: true,
  price: true,
  originalPrice: true,
  isFree: true,
  rating: true,
  reviewCount: true,
  viewCount: true,
  purchaseCount: true,
  createdAt: true,
  seller: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

/**
 * 상품 상세용 셀렉트
 */
export const productDetailSelect = {
  ...productListSelect,
  description: true,
  images: true,
  files: true,
  tags: true,
  features: true,
  techStack: true,
  license: true,
  status: true,
  isAiGenerated: true,
  aiTool: true,
  updatedAt: true,
} as const;

/**
 * 사용자 목록용 최소 셀렉트
 */
export const userListSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  isSeller: true,
  createdAt: true,
} as const;

/**
 * 튜토리얼 목록용 최소 셀렉트
 */
export const tutorialListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  thumbnail: true,
  difficulty: true,
  readTime: true,
  viewCount: true,
  likeCount: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} as const;

// ============================================
// 배치 처리
// ============================================

/**
 * 배치 처리 헬퍼
 * - 대량 데이터 처리 시 메모리 최적화
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * 병렬 배치 처리 헬퍼
 * - 동시 실행 수 제한
 */
export async function processParallelBatch<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  
  return results;
}

// ============================================
// 성능 측정
// ============================================

/**
 * 쿼리 실행 시간 측정
 */
export async function measureQueryTime<T>(
  name: string,
  query: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await query();
  const duration = performance.now() - start;
  
  if (duration > 1000) {
    console.warn(`[SLOW QUERY] ${name}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

/**
 * 쿼리 실행 시간 로깅 데코레이터
 */
export function withQueryTiming<T extends (...args: unknown[]) => Promise<unknown>>(
  name: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    const result = await fn(...args);
    const duration = performance.now() - start;
    
    if (process.env.NODE_ENV === 'development' || duration > 1000) {
      console.log(`[QUERY] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
}
