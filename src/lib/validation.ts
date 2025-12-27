/**
 * 입력 유효성 검증 유틸리티
 *
 * Zod 스키마를 사용한 타입 안전한 검증을 제공합니다.
 */

import { z } from "zod";

// ============================================
// 기본 검증 스키마
// ============================================

/**
 * 이메일 검증
 */
export const emailSchema = z
  .string()
  .email("유효한 이메일을 입력해주세요")
  .min(5, "이메일은 5자 이상이어야 합니다")
  .max(254, "이메일은 254자 이하여야 합니다");

/**
 * 비밀번호 검증 (최소 8자, 대소문자, 숫자, 특수문자 포함)
 */
export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다")
  .max(128, "비밀번호는 128자 이하여야 합니다")
  .regex(/[a-z]/, "소문자를 포함해야 합니다")
  .regex(/[A-Z]/, "대문자를 포함해야 합니다")
  .regex(/[0-9]/, "숫자를 포함해야 합니다")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "특수문자를 포함해야 합니다");

/**
 * 사용자명 검증
 */
export const usernameSchema = z
  .string()
  .min(2, "사용자명은 2자 이상이어야 합니다")
  .max(50, "사용자명은 50자 이하여야 합니다")
  .regex(/^[a-zA-Z0-9가-힣_-]+$/, "영문, 숫자, 한글, 밑줄, 하이픈만 사용 가능합니다");

/**
 * 전화번호 검증 (한국)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^(01[016789])-?[0-9]{3,4}-?[0-9]{4}$/,
    "유효한 전화번호를 입력해주세요"
  );

/**
 * URL 검증
 */
export const urlSchema = z
  .string()
  .url("유효한 URL을 입력해주세요")
  .max(2048, "URL은 2048자 이하여야 합니다");

/**
 * UUID 검증
 */
export const uuidSchema = z
  .string()
  .uuid("유효한 ID가 아닙니다");

// ============================================
// 상품 관련 스키마
// ============================================

/**
 * 상품 타입
 */
export const productTypeSchema = z.enum([
  "DIGITAL_PRODUCT",
  "BOOK",
  "VIDEO_SERIES",
  "MUSIC_ALBUM",
]);

/**
 * 가격 검증
 */
export const priceSchema = z
  .number()
  .int("가격은 정수여야 합니다")
  .min(0, "가격은 0 이상이어야 합니다")
  .max(100000000, "가격은 1억 이하여야 합니다");

/**
 * 상품 생성 스키마
 */
export const createProductSchema = z.object({
  title: z
    .string()
    .min(2, "제목은 2자 이상이어야 합니다")
    .max(200, "제목은 200자 이하여야 합니다"),
  shortDescription: z
    .string()
    .min(10, "간단한 설명은 10자 이상이어야 합니다")
    .max(500, "간단한 설명은 500자 이하여야 합니다"),
  description: z
    .string()
    .min(50, "상세 설명은 50자 이상이어야 합니다")
    .max(10000, "상세 설명은 10000자 이하여야 합니다"),
  price: priceSchema,
  categoryId: uuidSchema,
  type: productTypeSchema.optional().default("DIGITAL_PRODUCT"),
  thumbnailUrl: urlSchema.optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

/**
 * 상품 수정 스키마
 */
export const updateProductSchema = createProductSchema.partial();

// ============================================
// 리뷰 관련 스키마
// ============================================

/**
 * 평점 검증
 */
export const ratingSchema = z
  .number()
  .int("평점은 정수여야 합니다")
  .min(1, "평점은 1 이상이어야 합니다")
  .max(5, "평점은 5 이하여야 합니다");

/**
 * 리뷰 생성 스키마
 */
export const createReviewSchema = z.object({
  rating: ratingSchema,
  content: z
    .string()
    .min(10, "리뷰 내용은 10자 이상이어야 합니다")
    .max(2000, "리뷰 내용은 2000자 이하여야 합니다"),
});

// ============================================
// 페이지네이션 스키마
// ============================================

/**
 * 페이지 번호 검증
 */
export const pageSchema = z
  .number()
  .int("페이지 번호는 정수여야 합니다")
  .min(1, "페이지 번호는 1 이상이어야 합니다")
  .default(1);

/**
 * 페이지 크기 검증
 */
export const pageSizeSchema = z
  .number()
  .int("페이지 크기는 정수여야 합니다")
  .min(1, "페이지 크기는 1 이상이어야 합니다")
  .max(100, "페이지 크기는 100 이하여야 합니다")
  .default(20);

/**
 * 페이지네이션 스키마
 */
export const paginationSchema = z.object({
  page: pageSchema,
  limit: pageSizeSchema,
});

// ============================================
// 검증 헬퍼 함수
// ============================================

/**
 * 검증 결과 타입
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

/**
 * 안전한 스키마 검증 (에러 throw 없음)
 *
 * @param schema - Zod 스키마
 * @param data - 검증할 데이터
 * @returns 검증 결과
 *
 * @example
 * const result = safeValidate(emailSchema, "test@example.com");
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.log(result.errors);
 * }
 */
export function safeValidate<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".") || "value";
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return { success: false, errors };
}

/**
 * 검증 에러를 사람이 읽기 쉬운 문자열로 변환
 *
 * @param errors - 검증 에러 객체
 * @returns 포맷팅된 에러 메시지
 */
export function formatValidationErrors(
  errors: Record<string, string[]>
): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
    .join("; ");
}

/**
 * 문자열이 안전한지 검사 (XSS 방지)
 *
 * @param value - 검사할 문자열
 * @returns 안전하면 true
 */
export function isSafeString(value: string | null | undefined): boolean {
  if (value == null) {
    return true;
  }

  // 위험한 패턴 감지
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(value));
}

/**
 * 숫자 범위 검증
 *
 * @param value - 검증할 값
 * @param min - 최소값
 * @param max - 최대값
 * @returns 범위 내면 true
 */
export function isInRange(
  value: number | null | undefined,
  min: number,
  max: number
): boolean {
  if (value == null) {
    return false;
  }
  return value >= min && value <= max;
}

/**
 * 한국 사업자등록번호 검증
 *
 * @param value - 사업자등록번호
 * @returns 유효하면 true
 */
export function isValidBusinessNumber(value: string | null | undefined): boolean {
  if (value == null) {
    return false;
  }

  const cleaned = value.replace(/-/g, "");
  if (cleaned.length !== 10) {
    return false;
  }

  if (!/^\d{10}$/.test(cleaned)) {
    return false;
  }

  // 체크섬 검증
  const checkIdxs = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i], 10) * checkIdxs[i];
  }

  sum += Math.floor((parseInt(cleaned[8], 10) * 5) / 10);
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === parseInt(cleaned[9], 10);
}

// ============================================
// 타입 추출
// ============================================

export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type Username = z.infer<typeof usernameSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type Url = z.infer<typeof urlSchema>;
export type Uuid = z.infer<typeof uuidSchema>;
export type ProductType = z.infer<typeof productTypeSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
