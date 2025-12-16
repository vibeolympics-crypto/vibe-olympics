/**
 * 애플리케이션 설정 상수
 * 모든 URL과 환경 설정을 중앙에서 관리
 */

// ============================================
// URL 설정
// ============================================

/**
 * 앱 기본 URL (프론트엔드)
 * 환경변수 우선순위: NEXT_PUBLIC_APP_URL > NEXT_PUBLIC_BASE_URL > NEXTAUTH_URL > fallback
 */
export const APP_URL = 
  process.env.NEXT_PUBLIC_APP_URL || 
  process.env.NEXT_PUBLIC_BASE_URL || 
  process.env.NEXTAUTH_URL || 
  "https://vibe-olympics.onrender.com";

/**
 * API 기본 URL (대부분 APP_URL과 동일)
 */
export const API_URL = APP_URL;

/**
 * 서버 사이드에서 사용할 내부 URL
 */
export const INTERNAL_URL = 
  process.env.NEXTAUTH_URL || 
  APP_URL;

// ============================================
// 이메일 설정
// ============================================

/**
 * 발신 이메일 주소
 */
export const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@vibeolympics.com";

/**
 * 이메일 발신자 이름
 */
export const FROM_NAME = "Vibe Olympics";

// ============================================
// 사이트 메타데이터
// ============================================

export const SITE_CONFIG = {
  name: "Vibe Olympics",
  description: "AI 생성 디지털 콘텐츠 판도라 샵",
  shortDescription: "AI 생성 콘텐츠를 발견하고 소유하세요",
  url: APP_URL,
  ogImage: `${APP_URL}/og-image.png`,
  locale: "ko_KR",
  alternateLocale: "en_US",
  twitter: "@vibeolympics",
  email: "support@vibeolympics.com",
} as const;

// ============================================
// 환경 설정
// ============================================

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export const IS_TEST = process.env.NODE_ENV === "test";

// ============================================
// 기능 플래그
// ============================================

export const FEATURES = {
  /** 푸시 알림 활성화 여부 */
  pushNotifications: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  
  /** Sentry 에러 추적 활성화 여부 */
  sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  /** AI 챗봇 활성화 여부 */
  aiChatbot: !!process.env.ANTHROPIC_API_KEY,
  
  /** Stripe 결제 활성화 여부 */
  stripePayment: !!process.env.STRIPE_SECRET_KEY,
  
  /** 부트페이 결제 활성화 여부 */
  bootpayPayment: !!process.env.BOOTPAY_REST_API_KEY,
} as const;

// ============================================
// API 제한 설정
// ============================================

export const API_LIMITS = {
  /** 기본 페이지네이션 크기 */
  defaultPageSize: 20,
  
  /** 최대 페이지네이션 크기 */
  maxPageSize: 100,
  
  /** 파일 업로드 최대 크기 (10MB) */
  maxFileSize: 10 * 1024 * 1024,
  
  /** 이미지 업로드 최대 크기 (5MB) */
  maxImageSize: 5 * 1024 * 1024,
} as const;

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 절대 URL 생성
 */
export function getAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${APP_URL}${cleanPath}`;
}

/**
 * API 엔드포인트 URL 생성
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const apiPath = cleanEndpoint.startsWith("/api") ? cleanEndpoint : `/api${cleanEndpoint}`;
  return `${API_URL}${apiPath}`;
}
