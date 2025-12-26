/**
 * @fileoverview Webhook 시그니처 검증 시스템
 * 결제 서비스별 시그니처 검증 통합
 *
 * 대응 위협: S6.2 (Webhook 무결성 검증 미흡)
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { securityLogger } from './index';

// ============================================
// 1. 시그니처 검증 인터페이스
// ============================================
export interface WebhookVerificationResult {
  valid: boolean;
  provider: string;
  error?: string;
  rawBody?: string;
}

export type WebhookProvider = 'stripe' | 'bootpay' | 'portone' | 'custom';

interface WebhookConfig {
  provider: WebhookProvider;
  secret: string;
  headerName?: string;
  algorithm?: string;
}

// ============================================
// 2. 개별 Provider 검증기
// ============================================
export const webhookVerifiers = {
  /**
   * Stripe Webhook 시그니처 검증
   * Format: t=timestamp,v1=signature
   */
  stripe: async (
    rawBody: string,
    signature: string,
    secret: string
  ): Promise<boolean> => {
    try {
      const elements = signature.split(',');
      const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
      const v1Signature = elements.find(e => e.startsWith('v1='))?.split('=')[1];

      if (!timestamp || !v1Signature) return false;

      // 타임스탬프 검증 (5분 허용)
      const timestampAge = Date.now() / 1000 - parseInt(timestamp, 10);
      if (Math.abs(timestampAge) > 300) {
        console.warn('[Webhook] Stripe timestamp too old:', timestampAge);
        return false;
      }

      // 시그니처 계산
      const payload = `${timestamp}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // Timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(v1Signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('[Webhook] Stripe verification error:', error);
      return false;
    }
  },

  /**
   * Bootpay Webhook 시그니처 검증
   * HMAC-SHA256 기반
   */
  bootpay: async (
    rawBody: string,
    signature: string,
    secret: string
  ): Promise<boolean> => {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('[Webhook] Bootpay verification error:', error);
      return false;
    }
  },

  /**
   * PortOne (아임포트) Webhook 시그니처 검증
   * imp_uid 기반 검증 + 추가 시그니처
   */
  portone: async (
    rawBody: string,
    signature: string,
    secret: string
  ): Promise<boolean> => {
    try {
      // PortOne은 시그니처와 함께 별도 API 검증 권장
      // 여기서는 기본 HMAC 검증
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('[Webhook] PortOne verification error:', error);
      return false;
    }
  },

  /**
   * 커스텀 Webhook 시그니처 검증
   * 알고리즘 지정 가능
   */
  custom: async (
    rawBody: string,
    signature: string,
    secret: string,
    algorithm: string = 'sha256'
  ): Promise<boolean> => {
    try {
      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('[Webhook] Custom verification error:', error);
      return false;
    }
  },
};

// ============================================
// 3. 통합 Webhook 검증 함수
// ============================================
const providerHeaders: Record<WebhookProvider, string> = {
  stripe: 'stripe-signature',
  bootpay: 'x-bootpay-signature',
  portone: 'x-portone-signature',
  custom: 'x-webhook-signature',
};

export async function verifyWebhook(
  request: NextRequest,
  config: WebhookConfig
): Promise<WebhookVerificationResult> {
  const { provider, secret, headerName, algorithm } = config;
  const context = securityLogger.extractContext(request);

  // 시그니처 헤더 추출
  const signatureHeader = headerName || providerHeaders[provider];
  const signature = request.headers.get(signatureHeader);

  if (!signature) {
    securityLogger.log({
      type: 'WEBHOOK_INVALID',
      severity: 'high',
      ...context,
      details: {
        provider,
        reason: 'Missing signature header',
        headerName: signatureHeader,
      },
    });
    return {
      valid: false,
      provider,
      error: `Missing ${signatureHeader} header`,
    };
  }

  // Raw body 추출
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (error) {
    return {
      valid: false,
      provider,
      error: 'Failed to read request body',
    };
  }

  // Provider별 검증
  let isValid: boolean;
  try {
    switch (provider) {
      case 'stripe':
        isValid = await webhookVerifiers.stripe(rawBody, signature, secret);
        break;
      case 'bootpay':
        isValid = await webhookVerifiers.bootpay(rawBody, signature, secret);
        break;
      case 'portone':
        isValid = await webhookVerifiers.portone(rawBody, signature, secret);
        break;
      case 'custom':
        isValid = await webhookVerifiers.custom(rawBody, signature, secret, algorithm);
        break;
      default:
        isValid = false;
    }
  } catch (error) {
    securityLogger.log({
      type: 'WEBHOOK_INVALID',
      severity: 'critical',
      ...context,
      details: {
        provider,
        reason: 'Verification error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    return {
      valid: false,
      provider,
      error: 'Verification failed',
    };
  }

  // 결과 로깅
  if (!isValid) {
    securityLogger.log({
      type: 'WEBHOOK_INVALID',
      severity: 'critical',
      ...context,
      details: {
        provider,
        reason: 'Signature mismatch',
        endpoint: request.nextUrl.pathname,
      },
    });
  }

  return {
    valid: isValid,
    provider,
    rawBody: isValid ? rawBody : undefined,
    error: isValid ? undefined : 'Invalid signature',
  };
}

// ============================================
// 4. Webhook 미들웨어
// ============================================
export async function withWebhookVerification(
  request: NextRequest,
  handler: (req: NextRequest, rawBody: string) => Promise<NextResponse>,
  config: WebhookConfig
): Promise<NextResponse> {
  const result = await verifyWebhook(request, config);

  if (!result.valid) {
    return new NextResponse(
      JSON.stringify({
        error: 'Webhook signature verification failed',
        details: result.error,
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // rawBody와 함께 핸들러 호출
  // 주의: request.text()는 한 번만 호출 가능하므로 rawBody 전달
  return handler(request, result.rawBody!);
}

// ============================================
// 5. 결제 서비스별 헬퍼
// ============================================
export const paymentWebhooks = {
  /**
   * Stripe Webhook 처리
   */
  stripe: (secret?: string) => ({
    provider: 'stripe' as WebhookProvider,
    secret: secret || process.env.STRIPE_WEBHOOK_SECRET || '',
  }),

  /**
   * Bootpay Webhook 처리
   */
  bootpay: (secret?: string) => ({
    provider: 'bootpay' as WebhookProvider,
    secret: secret || process.env.BOOTPAY_WEBHOOK_SECRET || '',
  }),

  /**
   * PortOne Webhook 처리
   */
  portone: (secret?: string) => ({
    provider: 'portone' as WebhookProvider,
    secret: secret || process.env.PORTONE_WEBHOOK_SECRET || '',
  }),
};

// ============================================
// 6. Replay Attack 방어
// ============================================
const processedWebhooks = new Map<string, number>();
const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5분

export const replayProtection = {
  /**
   * Webhook ID가 이미 처리되었는지 확인
   */
  isDuplicate: (webhookId: string): boolean => {
    const existingTimestamp = processedWebhooks.get(webhookId);
    if (!existingTimestamp) return false;

    // 윈도우 내에 있으면 중복
    return Date.now() - existingTimestamp < REPLAY_WINDOW_MS;
  },

  /**
   * Webhook ID 기록
   */
  record: (webhookId: string): void => {
    processedWebhooks.set(webhookId, Date.now());

    // 오래된 레코드 정리
    if (processedWebhooks.size > 10000) {
      replayProtection.cleanup();
    }
  },

  /**
   * 만료된 레코드 정리
   */
  cleanup: (): void => {
    const now = Date.now();
    for (const [id, timestamp] of processedWebhooks.entries()) {
      if (now - timestamp > REPLAY_WINDOW_MS) {
        processedWebhooks.delete(id);
      }
    }
  },
};

/**
 * Replay 방어가 포함된 Webhook 검증
 */
export async function verifyWebhookWithReplayProtection(
  request: NextRequest,
  config: WebhookConfig,
  webhookIdExtractor: (body: string) => string | null
): Promise<WebhookVerificationResult> {
  const result = await verifyWebhook(request, config);

  if (!result.valid) return result;

  // Webhook ID 추출 및 중복 체크
  const webhookId = webhookIdExtractor(result.rawBody!);
  if (!webhookId) {
    return {
      ...result,
      valid: false,
      error: 'Could not extract webhook ID',
    };
  }

  if (replayProtection.isDuplicate(webhookId)) {
    securityLogger.log({
      type: 'WEBHOOK_INVALID',
      severity: 'high',
      ...securityLogger.extractContext(request),
      details: {
        provider: config.provider,
        reason: 'Replay attack detected',
        webhookId,
      },
    });
    return {
      ...result,
      valid: false,
      error: 'Duplicate webhook (replay attack prevented)',
    };
  }

  // 처리 기록
  replayProtection.record(webhookId);

  return result;
}

export default {
  verify: verifyWebhook,
  verifyWithReplayProtection: verifyWebhookWithReplayProtection,
  withVerification: withWebhookVerification,
  verifiers: webhookVerifiers,
  paymentWebhooks,
  replayProtection,
};
