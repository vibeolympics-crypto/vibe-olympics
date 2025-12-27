/**
 * API 에러 응답 표준화 유틸리티
 *
 * 일관된 에러 응답 형식을 제공합니다:
 * {
 *   error: {
 *     code: string,
 *     message: string,
 *     details?: unknown
 *   }
 * }
 */

import { NextResponse } from "next/server";

/**
 * 표준 에러 코드
 */
export const ErrorCode = {
  // 인증/권한 관련 (4xx)
  AUTH_REQUIRED: "AUTH_REQUIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  FORBIDDEN: "FORBIDDEN",

  // 요청 유효성 관련 (4xx)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",

  // 리소스 관련 (4xx)
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // 비즈니스 로직 관련 (4xx)
  PURCHASE_NOT_ALLOWED: "PURCHASE_NOT_ALLOWED",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  REFUND_PERIOD_EXPIRED: "REFUND_PERIOD_EXPIRED",

  // 서버 에러 (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // Rate Limit (429)
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCodeType,
    message: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * NextResponse로 변환
   */
  toResponse(): NextResponse {
    const errorBody: { code: ErrorCodeType; message: string; details?: unknown } = {
      code: this.code,
      message: this.message,
    };
    if (this.details !== undefined) {
      errorBody.details = this.details;
    }
    return NextResponse.json({ error: errorBody }, { status: this.statusCode });
  }

  // 팩토리 메서드들
  static authRequired(message = "로그인이 필요합니다"): ApiError {
    return new ApiError(ErrorCode.AUTH_REQUIRED, message, 401);
  }

  static forbidden(message = "접근 권한이 없습니다"): ApiError {
    return new ApiError(ErrorCode.FORBIDDEN, message, 403);
  }

  static notFound(resource = "리소스"): ApiError {
    return new ApiError(ErrorCode.NOT_FOUND, `${resource}를 찾을 수 없습니다`, 404);
  }

  static validationError(message: string, details?: unknown): ApiError {
    return new ApiError(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }

  static alreadyExists(resource = "리소스"): ApiError {
    return new ApiError(ErrorCode.ALREADY_EXISTS, `이미 존재하는 ${resource}입니다`, 409);
  }

  static conflict(message: string): ApiError {
    return new ApiError(ErrorCode.CONFLICT, message, 409);
  }

  static internalError(message = "서버 오류가 발생했습니다"): ApiError {
    return new ApiError(ErrorCode.INTERNAL_ERROR, message, 500);
  }

  static rateLimitExceeded(): ApiError {
    return new ApiError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      "요청 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요",
      429
    );
  }
}

/**
 * 에러 응답 헬퍼 함수 (기존 코드와의 호환성)
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  code?: ErrorCodeType
): NextResponse {
  const errorCode = code || (
    statusCode === 401 ? ErrorCode.AUTH_REQUIRED :
    statusCode === 403 ? ErrorCode.FORBIDDEN :
    statusCode === 404 ? ErrorCode.NOT_FOUND :
    statusCode === 429 ? ErrorCode.RATE_LIMIT_EXCEEDED :
    ErrorCode.INTERNAL_ERROR
  );

  return NextResponse.json(
    {
      error: {
        code: errorCode,
        message,
      },
    },
    { status: statusCode }
  );
}

/**
 * 에러를 ApiError로 변환하는 헬퍼
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(
      ErrorCode.INTERNAL_ERROR,
      error.message,
      500,
      process.env.NODE_ENV === "development" ? { stack: error.stack } : undefined
    );
  }

  return ApiError.internalError();
}

/**
 * 에러 핸들러 래퍼 (try-catch 간소화)
 */
export function withErrorHandler<T>(
  handler: () => Promise<T>,
  onError?: (error: ApiError) => NextResponse
): Promise<T | NextResponse> {
  return handler().catch((error) => {
    const apiError = toApiError(error);
    console.error(`[API Error] ${apiError.code}: ${apiError.message}`, error);
    return onError ? onError(apiError) : apiError.toResponse();
  });
}
