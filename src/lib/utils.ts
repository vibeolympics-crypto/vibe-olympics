/**
 * 유틸리티 함수 모음
 *
 * Null 안전한 유틸리티 함수들을 제공합니다.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스 병합
 *
 * @example
 * cn("px-4", "py-2", isActive && "bg-blue-500")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 가격 포맷팅 (Null 안전)
 *
 * @param price - 포맷팅할 가격 (null/undefined 허용)
 * @param fallback - 가격이 없을 때 반환할 기본값
 * @returns 포맷팅된 가격 문자열
 *
 * @example
 * formatPrice(10000) // "₩10,000"
 * formatPrice(null) // "₩0"
 * formatPrice(undefined, "가격 미정") // "가격 미정"
 */
export function formatPrice(
  price: number | null | undefined,
  fallback?: string
): string {
  if (price == null) {
    return fallback ?? new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(0);
  }

  if (!Number.isFinite(price)) {
    return fallback ?? "₩0";
  }

  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(price);
}

/**
 * 날짜 포맷팅 (Null 안전)
 *
 * @param date - 포맷팅할 날짜 (null/undefined 허용)
 * @param fallback - 날짜가 없거나 유효하지 않을 때 반환할 기본값
 * @returns 포맷팅된 날짜 문자열
 *
 * @example
 * formatDate(new Date()) // "2024년 1월 1일"
 * formatDate("2024-01-01") // "2024년 1월 1일"
 * formatDate(null) // "-"
 * formatDate("invalid", "날짜 없음") // "날짜 없음"
 */
export function formatDate(
  date: Date | string | null | undefined,
  fallback: string = "-"
): string {
  if (date == null) {
    return fallback;
  }

  try {
    const parsedDate = new Date(date);

    // Invalid Date 체크
    if (Number.isNaN(parsedDate.getTime())) {
      return fallback;
    }

    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(parsedDate);
  } catch {
    return fallback;
  }
}

/**
 * 상대적 시간 포맷팅 (Null 안전)
 *
 * @param date - 포맷팅할 날짜
 * @param fallback - 날짜가 없거나 유효하지 않을 때 반환할 기본값
 * @returns "방금 전", "5분 전", "2시간 전" 등
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 60000)) // "1분 전"
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
  fallback: string = "-"
): string {
  if (date == null) {
    return fallback;
  }

  try {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return fallback;
    }

    const now = Date.now();
    const diff = now - parsedDate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;

    return formatDate(parsedDate, fallback);
  } catch {
    return fallback;
  }
}

/**
 * 텍스트 자르기 (Null 안전)
 *
 * @param text - 자를 텍스트 (null/undefined 허용)
 * @param maxLength - 최대 길이
 * @param suffix - 자른 후 붙일 접미사
 * @returns 잘린 텍스트
 *
 * @example
 * truncateText("긴 텍스트입니다", 5) // "긴 텍스..."
 * truncateText(null, 10) // ""
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number,
  suffix: string = "..."
): string {
  if (text == null) {
    return "";
  }

  if (maxLength <= 0) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength) + suffix;
}

/**
 * 슬러그 생성 (Null 안전)
 *
 * @param text - 변환할 텍스트 (null/undefined 허용)
 * @returns URL 친화적인 슬러그
 *
 * @example
 * slugify("Hello World") // "hello-world"
 * slugify("한글 제목입니다") // "한글-제목입니다"
 * slugify(null) // ""
 */
export function slugify(text: string | null | undefined): string {
  if (text == null) {
    return "";
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * 안전한 JSON 파싱
 *
 * @param json - 파싱할 JSON 문자열
 * @param fallback - 파싱 실패 시 반환할 기본값
 * @returns 파싱된 객체 또는 기본값
 *
 * @example
 * safeJsonParse('{"key": "value"}') // { key: "value" }
 * safeJsonParse('invalid', {}) // {}
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  fallback: T
): T {
  if (json == null) {
    return fallback;
  }

  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 배열에서 null/undefined 제거
 *
 * @param arr - 필터링할 배열
 * @returns null/undefined가 제거된 배열
 *
 * @example
 * compact([1, null, 2, undefined, 3]) // [1, 2, 3]
 */
export function compact<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter((item): item is T => item != null);
}

/**
 * 첫 번째 non-null 값 반환
 *
 * @param values - 검사할 값들
 * @returns 첫 번째 유효한 값 또는 undefined
 *
 * @example
 * coalesce(null, undefined, "value") // "value"
 */
export function coalesce<T>(...values: (T | null | undefined)[]): T | undefined {
  for (const value of values) {
    if (value != null) {
      return value;
    }
  }
  return undefined;
}

/**
 * 빈 문자열 체크
 *
 * @param value - 검사할 값
 * @returns 비어있으면 true
 *
 * @example
 * isEmpty(null) // true
 * isEmpty("") // true
 * isEmpty("  ") // true
 * isEmpty("text") // false
 */
export function isEmpty(value: string | null | undefined): boolean {
  return value == null || value.trim() === "";
}

/**
 * 안전한 객체 프로퍼티 접근
 *
 * @param obj - 대상 객체
 * @param path - 점 표기법 경로
 * @param fallback - 값이 없을 때 반환할 기본값
 * @returns 프로퍼티 값 또는 기본값
 *
 * @example
 * getProperty({ a: { b: 1 } }, "a.b") // 1
 * getProperty({ a: { b: 1 } }, "a.c", 0) // 0
 */
export function getProperty<T>(
  obj: Record<string, unknown> | null | undefined,
  path: string,
  fallback?: T
): T | undefined {
  if (obj == null) {
    return fallback;
  }

  const keys = path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result == null || typeof result !== "object") {
      return fallback;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result as T) ?? fallback;
}
