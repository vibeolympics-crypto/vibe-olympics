/**
 * 환경변수 Zod 스키마 검증
 *
 * 런타임에서 환경변수의 타입 안전성을 보장합니다.
 * 서버 전용 변수와 클라이언트 공개 변수를 분리합니다.
 */

import { z } from "zod";

/**
 * 서버 전용 환경변수 스키마
 */
const serverEnvSchema = z.object({
  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET은 32자 이상이어야 합니다"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL은 유효한 URL이어야 합니다"),

  // Database
  DATABASE_URL: z.string().startsWith("postgresql://").or(z.string().startsWith("postgres://")),
  DIRECT_URL: z.string().startsWith("postgresql://").or(z.string().startsWith("postgres://")).optional(),

  // GitHub OAuth
  GITHUB_ID: z.string().min(1, "GITHUB_ID가 필요합니다"),
  GITHUB_SECRET: z.string().min(1, "GITHUB_SECRET가 필요합니다"),

  // Google OAuth (선택)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY가 필요합니다"),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .refine((val) => val.startsWith("sk_test_") || val.startsWith("sk_live_"), {
      message: "STRIPE_SECRET_KEY는 sk_test_ 또는 sk_live_로 시작해야 합니다",
    }),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),

  // Resend Email
  RESEND_API_KEY: z.string().startsWith("re_"),
  FROM_EMAIL: z.string().email().optional(),

  // Sentry (선택)
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Internal API
  INTERNAL_API_KEY: z.string().optional(),

  // AI
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional(),

  // Bootpay (선택)
  BOOTPAY_REST_API_KEY: z.string().optional(),
  BOOTPAY_PRIVATE_KEY: z.string().optional(),
});

/**
 * 클라이언트 공개 환경변수 스키마 (NEXT_PUBLIC_ 접두사)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().includes("supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().includes("sentry.io").optional(),
  NEXT_PUBLIC_BOOTPAY_JS_KEY: z.string().optional(),
});

/**
 * 전체 환경변수 스키마
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema);

/**
 * 환경변수 타입
 */
export type Env = z.infer<typeof envSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * 환경변수 검증 및 파싱
 *
 * 개발 환경에서는 경고만 표시하고, 프로덕션에서는 에러 발생
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, value]) => `  ${key}: ${value?.join(", ")}`)
      .join("\n");

    if (process.env.NODE_ENV === "production") {
      throw new Error(`환경변수 검증 실패:\n${errorMessages}`);
    }

    // 개발 환경에서는 경고만 출력
    if (typeof window === "undefined") {
      console.warn(`[ENV] 환경변수 검증 경고:\n${errorMessages}`);
    }
  }

  // 파싱된 값 또는 원본 process.env 반환
  return (parsed.success ? parsed.data : process.env) as Env;
}

/**
 * 검증된 환경변수 (서버)
 *
 * @example
 * import { env } from "@/lib/env";
 * console.log(env.DATABASE_URL);
 */
export const env: Env = validateEnv();

/**
 * 특정 환경변수 가져오기 (null 안전)
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] | undefined {
  return env[key];
}

/**
 * 필수 환경변수 가져오기 (없으면 에러)
 */
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(`필수 환경변수 ${key}가 설정되지 않았습니다`);
  }
  return value as NonNullable<Env[K]>;
}

/**
 * 현재 환경 확인 헬퍼
 */
export const isDev = env.NODE_ENV === "development";
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
