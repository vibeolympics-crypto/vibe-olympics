/**
 * 외부 결제 제공자 통합 시스템
 * - PayPal: 글로벌 결제
 * - Toss Payments: 국내 결제
 * - Stripe: 글로벌 카드 결제
 */

// ==================== 타입 정의 ====================

export type PaymentProvider = 'paypal' | 'toss' | 'stripe' | 'bootpay';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethod = 
  | 'card'
  | 'bank_transfer'
  | 'virtual_account'
  | 'phone'
  | 'paypal'
  | 'kakao'
  | 'naver'
  | 'toss'
  | 'apple_pay'
  | 'google_pay';

export type Currency = 'KRW' | 'USD' | 'EUR' | 'JPY' | 'CNY';

export interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  currency: Currency;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  returnUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  provider: PaymentProvider;
  transactionId?: string;
  orderId?: string;
  status: PaymentStatus;
  amount?: number;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  paidAt?: Date;
  error?: string;
  errorCode?: string;
  rawResponse?: unknown;
  redirectUrl?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number; // undefined면 전액 환불
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface PaymentWebhookEvent {
  provider: PaymentProvider;
  eventType: string;
  transactionId: string;
  orderId?: string;
  status: PaymentStatus;
  amount?: number;
  rawData: unknown;
}

export interface ProviderConfig {
  paypal?: {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
  toss?: {
    clientKey: string;
    secretKey: string;
  };
  stripe?: {
    publishableKey: string;
    secretKey: string;
  };
}

// ==================== PayPal 결제 ====================

export class PayPalProvider {
  private clientId: string;
  private clientSecret: string;
  private mode: 'sandbox' | 'live';
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: { clientId: string; clientSecret: string; mode?: 'sandbox' | 'live' }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.mode = config.mode || 'sandbox';
    this.baseUrl = this.mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
  }

  // 액세스 토큰 획득
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('PayPal 인증 실패');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
    
    return this.accessToken as string;
  }

  // 결제 주문 생성
  async createOrder(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const token = await this.getAccessToken();
      
      // KRW → USD 변환 (PayPal은 KRW 직접 지원 안함)
      const usdAmount = request.currency === 'KRW' 
        ? (request.amount / 1300).toFixed(2) 
        : request.amount.toFixed(2);

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: request.orderId,
          description: request.orderName,
          amount: {
            currency_code: request.currency === 'KRW' ? 'USD' : request.currency,
            value: usdAmount,
          },
          custom_id: request.productId,
        }],
        application_context: {
          brand_name: 'Vibe Olympics',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: request.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancel_url: request.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
        },
      };

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          provider: 'paypal',
          status: 'failed',
          error: data.message || 'PayPal 주문 생성 실패',
          errorCode: data.name,
          rawResponse: data,
        };
      }

      // 승인 URL 찾기
      const approveLink = data.links?.find((link: { rel: string }) => link.rel === 'approve');

      return {
        success: true,
        provider: 'paypal',
        transactionId: data.id,
        orderId: request.orderId,
        status: 'pending',
        amount: request.amount,
        currency: request.currency,
        redirectUrl: approveLink?.href,
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'paypal',
        status: 'failed',
        error: error instanceof Error ? error.message : 'PayPal 결제 오류',
      };
    }
  }

  // 결제 승인 (캡처)
  async captureOrder(paypalOrderId: string): Promise<PaymentResult> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'COMPLETED') {
        return {
          success: false,
          provider: 'paypal',
          status: 'failed',
          error: data.message || 'PayPal 결제 승인 실패',
          errorCode: data.name,
          rawResponse: data,
        };
      }

      const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

      return {
        success: true,
        provider: 'paypal',
        transactionId: capture?.id || paypalOrderId,
        orderId: data.purchase_units?.[0]?.reference_id,
        status: 'completed',
        amount: parseFloat(capture?.amount?.value || '0'),
        currency: capture?.amount?.currency_code as Currency,
        paymentMethod: 'paypal',
        paidAt: new Date(),
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'paypal',
        status: 'failed',
        error: error instanceof Error ? error.message : 'PayPal 승인 오류',
      };
    }
  }

  // 환불 처리
  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const token = await this.getAccessToken();

      const refundData: { note_to_payer?: string; amount?: { value: string; currency_code: string } } = {};
      if (request.reason) {
        refundData.note_to_payer = request.reason;
      }
      if (request.amount) {
        refundData.amount = {
          value: request.amount.toFixed(2),
          currency_code: 'USD',
        };
      }

      const response = await fetch(
        `${this.baseUrl}/v2/payments/captures/${request.transactionId}/refund`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(refundData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
          error: data.message || 'PayPal 환불 실패',
        };
      }

      return {
        success: true,
        refundId: data.id,
        amount: parseFloat(data.amount?.value || '0'),
        status: data.status === 'COMPLETED' ? 'completed' : 'pending',
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'PayPal 환불 오류',
      };
    }
  }

  // 웹훅 이벤트 검증
  async verifyWebhook(
    headers: Record<string, string>,
    body: string,
    webhookId: string
  ): Promise<boolean> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: JSON.parse(body),
        }),
      });

      const data = await response.json();
      return data.verification_status === 'SUCCESS';
    } catch {
      return false;
    }
  }
}

// ==================== Toss Payments 결제 ====================

export class TossPaymentsProvider {
  private clientKey: string;
  private secretKey: string;
  private baseUrl = 'https://api.tosspayments.com';

  constructor(config: { clientKey: string; secretKey: string }) {
    this.clientKey = config.clientKey;
    this.secretKey = config.secretKey;
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`;
  }

  // 결제 위젯용 클라이언트 키 반환
  getClientKey(): string {
    return this.clientKey;
  }

  // 결제 승인
  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number
  ): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          provider: 'toss',
          status: 'failed',
          error: data.message || 'Toss 결제 승인 실패',
          errorCode: data.code,
          rawResponse: data,
        };
      }

      return {
        success: true,
        provider: 'toss',
        transactionId: data.paymentKey,
        orderId: data.orderId,
        status: this.mapTossStatus(data.status),
        amount: data.totalAmount,
        currency: 'KRW',
        paymentMethod: this.mapTossMethod(data.method),
        paidAt: data.approvedAt ? new Date(data.approvedAt) : new Date(),
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'toss',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Toss 결제 오류',
      };
    }
  }

  // 결제 조회
  async getPayment(paymentKey: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentKey}`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          provider: 'toss',
          status: 'failed',
          error: data.message || 'Toss 결제 조회 실패',
          errorCode: data.code,
        };
      }

      return {
        success: true,
        provider: 'toss',
        transactionId: data.paymentKey,
        orderId: data.orderId,
        status: this.mapTossStatus(data.status),
        amount: data.totalAmount,
        currency: 'KRW',
        paymentMethod: this.mapTossMethod(data.method),
        paidAt: data.approvedAt ? new Date(data.approvedAt) : undefined,
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'toss',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Toss 조회 오류',
      };
    }
  }

  // 주문 ID로 결제 조회
  async getPaymentByOrderId(orderId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          provider: 'toss',
          status: 'failed',
          error: data.message || 'Toss 결제 조회 실패',
          errorCode: data.code,
        };
      }

      return {
        success: true,
        provider: 'toss',
        transactionId: data.paymentKey,
        orderId: data.orderId,
        status: this.mapTossStatus(data.status),
        amount: data.totalAmount,
        currency: 'KRW',
        paymentMethod: this.mapTossMethod(data.method),
        paidAt: data.approvedAt ? new Date(data.approvedAt) : undefined,
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'toss',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Toss 조회 오류',
      };
    }
  }

  // 결제 취소/환불
  async cancelPayment(
    paymentKey: string,
    cancelReason: string,
    cancelAmount?: number
  ): Promise<RefundResult> {
    try {
      const body: { cancelReason: string; cancelAmount?: number } = { cancelReason };
      if (cancelAmount) {
        body.cancelAmount = cancelAmount;
      }

      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
          error: data.message || 'Toss 결제 취소 실패',
        };
      }

      const latestCancel = data.cancels?.[data.cancels.length - 1];

      return {
        success: true,
        refundId: latestCancel?.transactionKey,
        amount: latestCancel?.cancelAmount || cancelAmount,
        status: 'completed',
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Toss 취소 오류',
      };
    }
  }

  // 가상계좌 발급
  async createVirtualAccount(
    orderId: string,
    amount: number,
    bank: string,
    customerName: string,
    dueDate?: string
  ): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/virtual-accounts`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          bank,
          customerName,
          dueDate: dueDate || this.getDefaultDueDate(),
          validHours: 24,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          provider: 'toss',
          status: 'failed',
          error: data.message || '가상계좌 발급 실패',
          errorCode: data.code,
        };
      }

      return {
        success: true,
        provider: 'toss',
        transactionId: data.paymentKey,
        orderId: data.orderId,
        status: 'pending',
        amount: data.totalAmount,
        currency: 'KRW',
        paymentMethod: 'virtual_account',
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'toss',
        status: 'failed',
        error: error instanceof Error ? error.message : '가상계좌 발급 오류',
      };
    }
  }

  private getDefaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }

  private mapTossStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'READY': 'pending',
      'IN_PROGRESS': 'processing',
      'WAITING_FOR_DEPOSIT': 'pending',
      'DONE': 'completed',
      'CANCELED': 'cancelled',
      'PARTIAL_CANCELED': 'partially_refunded',
      'ABORTED': 'failed',
      'EXPIRED': 'failed',
    };
    return statusMap[status] || 'pending';
  }

  private mapTossMethod(method: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      '카드': 'card',
      '가상계좌': 'virtual_account',
      '계좌이체': 'bank_transfer',
      '휴대폰': 'phone',
      '토스페이': 'toss',
      '카카오페이': 'kakao',
      '네이버페이': 'naver',
    };
    return methodMap[method] || 'card';
  }
}

// ==================== Stripe 결제 ====================

export class StripeProvider {
  private secretKey: string;
  private publishableKey: string;
  private baseUrl = 'https://api.stripe.com';

  constructor(config: { publishableKey: string; secretKey: string }) {
    this.publishableKey = config.publishableKey;
    this.secretKey = config.secretKey;
  }

  getPublishableKey(): string {
    return this.publishableKey;
  }

  // 결제 인텐트 생성
  async createPaymentIntent(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const params = new URLSearchParams({
        amount: Math.round(request.amount).toString(),
        currency: request.currency.toLowerCase(),
        'metadata[orderId]': request.orderId,
        'metadata[productId]': request.productId || '',
        description: request.orderName,
      });

      if (request.customerEmail) {
        params.append('receipt_email', request.customerEmail);
      }

      const response = await fetch(`${this.baseUrl}/v1/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          provider: 'stripe',
          status: 'failed',
          error: data.error?.message || 'Stripe 결제 인텐트 생성 실패',
          errorCode: data.error?.code,
          rawResponse: data,
        };
      }

      return {
        success: true,
        provider: 'stripe',
        transactionId: data.id,
        orderId: request.orderId,
        status: this.mapStripeStatus(data.status),
        amount: data.amount,
        currency: data.currency.toUpperCase() as Currency,
        rawResponse: { clientSecret: data.client_secret, id: data.id },
      };
    } catch (error) {
      return {
        success: false,
        provider: 'stripe',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Stripe 오류',
      };
    }
  }

  // 결제 인텐트 확인
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    try {
      const params = new URLSearchParams({
        payment_method: paymentMethodId,
      });

      const response = await fetch(
        `${this.baseUrl}/v1/payment_intents/${paymentIntentId}/confirm`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          provider: 'stripe',
          status: 'failed',
          error: data.error?.message || 'Stripe 결제 확인 실패',
          errorCode: data.error?.code,
        };
      }

      return {
        success: data.status === 'succeeded',
        provider: 'stripe',
        transactionId: data.id,
        orderId: data.metadata?.orderId,
        status: this.mapStripeStatus(data.status),
        amount: data.amount,
        currency: data.currency.toUpperCase() as Currency,
        paymentMethod: 'card',
        paidAt: data.status === 'succeeded' ? new Date() : undefined,
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'stripe',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Stripe 확인 오류',
      };
    }
  }

  // 결제 인텐트 조회
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payment_intents/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          provider: 'stripe',
          status: 'failed',
          error: data.error?.message || 'Stripe 조회 실패',
        };
      }

      return {
        success: data.status === 'succeeded',
        provider: 'stripe',
        transactionId: data.id,
        orderId: data.metadata?.orderId,
        status: this.mapStripeStatus(data.status),
        amount: data.amount,
        currency: data.currency.toUpperCase() as Currency,
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'stripe',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Stripe 조회 오류',
      };
    }
  }

  // 환불
  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const params = new URLSearchParams({
        payment_intent: request.transactionId,
      });

      if (request.amount) {
        params.append('amount', Math.round(request.amount).toString());
      }
      if (request.reason) {
        params.append('reason', 'requested_by_customer');
        params.append('metadata[reason]', request.reason);
      }

      const response = await fetch(`${this.baseUrl}/v1/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
          error: data.error?.message || 'Stripe 환불 실패',
        };
      }

      return {
        success: true,
        refundId: data.id,
        amount: data.amount,
        status: data.status === 'succeeded' ? 'completed' : 'pending',
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Stripe 환불 오류',
      };
    }
  }

  // 웹훅 검증
  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    try {
      // Stripe 웹훅 서명 검증 (간소화된 버전)
      // 실제 구현시에는 stripe 라이브러리 사용 권장
      const timestamp = signature.split(',').find(s => s.startsWith('t='))?.split('=')[1];
      if (!timestamp) return false;
      
      const signedPayload = `${timestamp}.${payload}`;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto');
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');
      
      const actualSig = signature.split(',').find(s => s.startsWith('v1='))?.split('=')[1];
      return actualSig === expectedSig;
    } catch {
      return false;
    }
  }

  private mapStripeStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'processing',
      'processing': 'processing',
      'requires_capture': 'processing',
      'canceled': 'cancelled',
      'succeeded': 'completed',
    };
    return statusMap[status] || 'pending';
  }
}

// ==================== 통합 결제 매니저 ====================

export class PaymentManager {
  private paypal?: PayPalProvider;
  private toss?: TossPaymentsProvider;
  private stripe?: StripeProvider;

  constructor(config?: ProviderConfig) {
    if (config?.paypal) {
      this.paypal = new PayPalProvider(config.paypal);
    }
    if (config?.toss) {
      this.toss = new TossPaymentsProvider(config.toss);
    }
    if (config?.stripe) {
      this.stripe = new StripeProvider(config.stripe);
    }
  }

  // 환경변수에서 자동 초기화
  static fromEnv(): PaymentManager {
    const config: ProviderConfig = {};

    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      config.paypal = {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        mode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox',
      };
    }

    if (process.env.TOSS_CLIENT_KEY && process.env.TOSS_SECRET_KEY) {
      config.toss = {
        clientKey: process.env.TOSS_CLIENT_KEY,
        secretKey: process.env.TOSS_SECRET_KEY,
      };
    }

    if (process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY) {
      config.stripe = {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
      };
    }

    return new PaymentManager(config);
  }

  // 사용 가능한 결제 제공자 목록
  getAvailableProviders(): PaymentProvider[] {
    const providers: PaymentProvider[] = [];
    if (this.paypal) providers.push('paypal');
    if (this.toss) providers.push('toss');
    if (this.stripe) providers.push('stripe');
    return providers;
  }

  // 제공자별 결제 생성
  async createPayment(
    provider: PaymentProvider,
    request: PaymentRequest
  ): Promise<PaymentResult> {
    switch (provider) {
      case 'paypal':
        if (!this.paypal) {
          return { success: false, provider, status: 'failed', error: 'PayPal 미설정' };
        }
        return this.paypal.createOrder(request);

      case 'stripe':
        if (!this.stripe) {
          return { success: false, provider, status: 'failed', error: 'Stripe 미설정' };
        }
        return this.stripe.createPaymentIntent(request);

      case 'toss':
        // Toss는 클라이언트 사이드에서 결제 위젯으로 처리 후 confirm 호출
        return {
          success: true,
          provider: 'toss',
          status: 'pending',
          orderId: request.orderId,
          amount: request.amount,
          currency: request.currency,
          rawResponse: { clientKey: this.toss?.getClientKey() },
        };

      default:
        return { success: false, provider, status: 'failed', error: '지원하지 않는 결제 제공자' };
    }
  }

  // 결제 승인/확인
  async confirmPayment(
    provider: PaymentProvider,
    transactionId: string,
    orderId?: string,
    amount?: number,
    additionalData?: Record<string, unknown>
  ): Promise<PaymentResult> {
    switch (provider) {
      case 'paypal':
        if (!this.paypal) {
          return { success: false, provider, status: 'failed', error: 'PayPal 미설정' };
        }
        return this.paypal.captureOrder(transactionId);

      case 'stripe':
        if (!this.stripe) {
          return { success: false, provider, status: 'failed', error: 'Stripe 미설정' };
        }
        return this.stripe.confirmPaymentIntent(
          transactionId,
          additionalData?.paymentMethodId as string
        );

      case 'toss':
        if (!this.toss || !orderId || !amount) {
          return { success: false, provider, status: 'failed', error: 'Toss 결제 정보 부족' };
        }
        return this.toss.confirmPayment(transactionId, orderId, amount);

      default:
        return { success: false, provider, status: 'failed', error: '지원하지 않는 결제 제공자' };
    }
  }

  // 환불 처리
  async refund(
    provider: PaymentProvider,
    request: RefundRequest
  ): Promise<RefundResult> {
    switch (provider) {
      case 'paypal':
        if (!this.paypal) {
          return { success: false, status: 'failed', error: 'PayPal 미설정' };
        }
        return this.paypal.refund(request);

      case 'stripe':
        if (!this.stripe) {
          return { success: false, status: 'failed', error: 'Stripe 미설정' };
        }
        return this.stripe.refund(request);

      case 'toss':
        if (!this.toss) {
          return { success: false, status: 'failed', error: 'Toss 미설정' };
        }
        return this.toss.cancelPayment(
          request.transactionId,
          request.reason || '고객 요청',
          request.amount
        );

      default:
        return { success: false, status: 'failed', error: '지원하지 않는 결제 제공자' };
    }
  }

  // 결제 조회
  async getPayment(
    provider: PaymentProvider,
    transactionId: string
  ): Promise<PaymentResult> {
    switch (provider) {
      case 'toss':
        if (!this.toss) {
          return { success: false, provider, status: 'failed', error: 'Toss 미설정' };
        }
        return this.toss.getPayment(transactionId);

      case 'stripe':
        if (!this.stripe) {
          return { success: false, provider, status: 'failed', error: 'Stripe 미설정' };
        }
        return this.stripe.getPaymentIntent(transactionId);

      default:
        return { success: false, provider, status: 'failed', error: '조회 미지원' };
    }
  }

  // 통화별 추천 결제 제공자
  getRecommendedProvider(currency: Currency): PaymentProvider | null {
    const providers = this.getAvailableProviders();
    
    if (currency === 'KRW') {
      // 한국 원화: Toss > Bootpay
      if (providers.includes('toss')) return 'toss';
    } else {
      // 외화: PayPal > Stripe
      if (providers.includes('paypal')) return 'paypal';
      if (providers.includes('stripe')) return 'stripe';
    }
    
    return providers[0] || null;
  }
}

// ==================== 유틸리티 함수 ====================

// 주문 ID 생성
export function generateOrderId(prefix = 'VO'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

// 금액 포맷팅
export function formatAmount(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat(currency === 'KRW' ? 'ko-KR' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2,
  });
  return formatter.format(amount);
}

// 환율 변환 (간이 버전)
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  // 실제 구현시에는 환율 API 사용 권장
  const rates: Record<Currency, number> = {
    KRW: 1,
    USD: 1300,
    EUR: 1400,
    JPY: 9,
    CNY: 180,
  };
  
  const amountInKRW = amount * rates[from];
  return Math.round(amountInKRW / rates[to] * 100) / 100;
}

// 결제 상태 한글 변환
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: '대기중',
    processing: '처리중',
    completed: '완료',
    failed: '실패',
    cancelled: '취소됨',
    refunded: '환불완료',
    partially_refunded: '부분환불',
  };
  return labels[status] || status;
}

// 결제 수단 한글 변환
export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    card: '신용/체크카드',
    bank_transfer: '계좌이체',
    virtual_account: '가상계좌',
    phone: '휴대폰결제',
    paypal: 'PayPal',
    kakao: '카카오페이',
    naver: '네이버페이',
    toss: '토스페이',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
  };
  return labels[method] || method;
}

// 데모 결제 결과 생성
export function generateDemoPaymentResult(
  provider: PaymentProvider,
  request: PaymentRequest,
  success = true
): PaymentResult {
  if (!success) {
    return {
      success: false,
      provider,
      status: 'failed',
      error: '데모 결제 실패',
      errorCode: 'DEMO_ERROR',
    };
  }

  return {
    success: true,
    provider,
    transactionId: `DEMO-${provider.toUpperCase()}-${Date.now()}`,
    orderId: request.orderId,
    status: 'completed',
    amount: request.amount,
    currency: request.currency,
    paymentMethod: provider === 'paypal' ? 'paypal' : 'card',
    paidAt: new Date(),
  };
}

// 싱글톤 인스턴스
let paymentManagerInstance: PaymentManager | null = null;

export function getPaymentManager(): PaymentManager {
  if (!paymentManagerInstance) {
    paymentManagerInstance = PaymentManager.fromEnv();
  }
  return paymentManagerInstance;
}
