/**
 * API 공통 유틸리티 함수
 * 인증 체크, 페이지네이션, 응답 포맷 등
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { Session } from "next-auth";

// ============================================
// 타입 정의
// ============================================

export interface AuthenticatedSession {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    role?: string;
    isSeller?: boolean;
  };
  expires: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

// ============================================
// 인증 유틸리티
// ============================================

/**
 * 인증 확인 및 세션 반환
 * @returns 세션 또는 에러 응답
 */
export async function requireAuth(): Promise<
  { session: AuthenticatedSession; error?: never } | 
  { session?: never; error: NextResponse<ApiErrorResponse> }
> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "인증이 필요합니다.", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  return { session: session as AuthenticatedSession };
}

/**
 * 관리자 권한 확인
 * @returns 세션 또는 에러 응답
 */
export async function requireAdmin(): Promise<
  { session: AuthenticatedSession; error?: never } | 
  { session?: never; error: NextResponse<ApiErrorResponse> }
> {
  const result = await requireAuth();
  
  if (result.error) {
    return result;
  }

  if (result.session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "관리자 권한이 필요합니다.", code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return result;
}

/**
 * 판매자 권한 확인
 * @returns 세션 또는 에러 응답
 */
export async function requireSeller(): Promise<
  { session: AuthenticatedSession; error?: never } | 
  { session?: never; error: NextResponse<ApiErrorResponse> }
> {
  const result = await requireAuth();
  
  if (result.error) {
    return result;
  }

  if (!result.session.user.isSeller && result.session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "판매자 권한이 필요합니다.", code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return result;
}

// ============================================
// 페이지네이션 유틸리티
// ============================================

/**
 * URL 파라미터에서 페이지네이션 정보 추출
 * @param request NextRequest 또는 URL searchParams
 * @param defaultLimit 기본 페이지 크기 (기본값: 20)
 * @param maxLimit 최대 페이지 크기 (기본값: 100)
 */
export function getPaginationParams(
  request: NextRequest | URLSearchParams,
  defaultLimit: number = 20,
  maxLimit: number = 100
): PaginationParams {
  const searchParams = request instanceof NextRequest 
    ? new URL(request.url).searchParams 
    : request;

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const rawLimit = parseInt(searchParams.get("limit") || String(defaultLimit), 10);
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * 페이지네이션 응답 생성
 * @param data 데이터 배열
 * @param total 전체 개수
 * @param params 페이지네이션 파라미터
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

// ============================================
// 응답 헬퍼
// ============================================

/**
 * 성공 응답 생성
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error: message, code, details },
    { status }
  );
}

/**
 * 404 응답 생성
 */
export function notFoundResponse(resource: string = "리소스"): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error: `${resource}를 찾을 수 없습니다.`, code: "NOT_FOUND" },
    { status: 404 }
  );
}

/**
 * 서버 에러 응답 생성
 */
export function serverErrorResponse(error?: unknown): NextResponse<ApiErrorResponse> {
  console.error("Server error:", error);
  return NextResponse.json(
    { error: "서버 오류가 발생했습니다.", code: "INTERNAL_SERVER_ERROR" },
    { status: 500 }
  );
}

// ============================================
// 요청 파라미터 유틸리티
// ============================================

/**
 * 검색 파라미터 추출
 */
export function getSearchParam(
  request: NextRequest,
  key: string,
  defaultValue?: string
): string | undefined {
  const searchParams = new URL(request.url).searchParams;
  return searchParams.get(key) || defaultValue;
}

/**
 * 숫자 파라미터 추출
 */
export function getNumberParam(
  request: NextRequest,
  key: string,
  defaultValue?: number
): number | undefined {
  const value = getSearchParam(request, key);
  if (value === undefined) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 불린 파라미터 추출
 */
export function getBooleanParam(
  request: NextRequest,
  key: string,
  defaultValue: boolean = false
): boolean {
  const value = getSearchParam(request, key);
  if (value === undefined) return defaultValue;
  return value === "true" || value === "1";
}

/**
 * 배열 파라미터 추출 (쉼표로 구분)
 */
export function getArrayParam(
  request: NextRequest,
  key: string
): string[] {
  const value = getSearchParam(request, key);
  if (!value) return [];
  return value.split(",").map(s => s.trim()).filter(Boolean);
}

// ============================================
// 날짜 유틸리티
// ============================================

/**
 * 날짜 범위 파라미터 추출
 */
export function getDateRangeParams(
  request: NextRequest
): { startDate?: Date; endDate?: Date } {
  const startDateStr = getSearchParam(request, "startDate");
  const endDateStr = getSearchParam(request, "endDate");

  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  // 유효한 날짜인지 확인
  return {
    startDate: startDate && !isNaN(startDate.getTime()) ? startDate : undefined,
    endDate: endDate && !isNaN(endDate.getTime()) ? endDate : undefined,
  };
}
