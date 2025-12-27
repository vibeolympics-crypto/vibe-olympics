/**
 * 외부 결제 제공자 통합 API
 * - PayPal, Toss, Stripe 결제 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getPaymentManager,
  generateOrderId,
  generateDemoPaymentResult,
  PaymentProvider,
  PaymentRequest,
  Currency,
} from '@/lib/payment-providers';
import { withSecurity, rateLimit, securityLogger } from '@/lib/security';

export const dynamic = 'force-dynamic';

// POST: 결제 처리
export async function POST(request: NextRequest) {
  return withSecurity(request, async (req) => {
    const context = securityLogger.extractContext(req);

    // Rate Limit 체크 (payment config: 1분 5회)
    const rateLimitResult = rateLimit.check(context.ip, 'payment');
    if (!rateLimitResult.allowed) {
      securityLogger.log({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'medium',
        ip: context.ip,
        userAgent: context.userAgent,
        details: { endpoint: '/api/payment/providers', action: 'POST' },
      });
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429, headers: rateLimit.headers(rateLimitResult) }
      );
    }

    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'low',
          ip: context.ip,
          userAgent: context.userAgent,
          details: { endpoint: '/api/payment/providers', reason: 'Unauthenticated payment attempt' },
        });
        return NextResponse.json(
          { error: '로그인이 필요합니다.' },
          { status: 401 }
        );
      }

      const body = await req.json();
      const { action } = body as { action: string };

      // 결제 액션 로깅
      securityLogger.log({
        type: 'LOGIN_SUCCESS', // 결제 이벤트 로깅용
        severity: 'low',
        ip: context.ip,
        userAgent: context.userAgent,
        userId: session.user.id,
        details: {
          endpoint: '/api/payment/providers',
          event: 'PAYMENT_ACTION',
          action,
        },
      });

      const paymentManager = getPaymentManager();

      switch (action) {
      // 결제 생성
      case 'create': {
        const { 
          provider, 
          orderName, 
          amount, 
          currency = 'KRW',
          productId,
          productName,
          returnUrl,
          cancelUrl,
          metadata,
        } = body as {
          provider: PaymentProvider;
          orderName: string;
          amount: number;
          currency?: Currency;
          productId?: string;
          productName?: string;
          returnUrl?: string;
          cancelUrl?: string;
          metadata?: Record<string, unknown>;
        };

        if (!provider || !orderName || !amount) {
          return NextResponse.json(
            { error: '필수 필드가 누락되었습니다.' },
            { status: 400 }
          );
        }

        const orderId = generateOrderId();
        const paymentRequest: PaymentRequest = {
          orderId,
          orderName,
          amount,
          currency,
          customerName: session.user.name || undefined,
          customerEmail: session.user.email || undefined,
          productId,
          productName,
          returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
          metadata: {
            ...metadata,
            userId: session.user.id,
          },
        };

        // 데모 모드 처리
        const availableProviders = paymentManager.getAvailableProviders();
        if (!availableProviders.includes(provider)) {
          // 실제 API 키가 없으면 데모 응답
          const demoResult = generateDemoPaymentResult(provider, paymentRequest);
          return NextResponse.json({
            ...demoResult,
            demo: true,
            message: `${provider} API 키가 설정되지 않아 데모 모드로 실행됩니다.`,
          });
        }

        const result = await paymentManager.createPayment(provider, paymentRequest);
        return NextResponse.json(result);
      }

      // 결제 승인/확인
      case 'confirm': {
        const { 
          provider, 
          transactionId, 
          orderId, 
          amount,
          paymentMethodId,
        } = body as {
          provider: PaymentProvider;
          transactionId: string;
          orderId?: string;
          amount?: number;
          paymentMethodId?: string;
        };

        if (!provider || !transactionId) {
          return NextResponse.json(
            { error: '필수 필드가 누락되었습니다.' },
            { status: 400 }
          );
        }

        const availableProviders = paymentManager.getAvailableProviders();
        if (!availableProviders.includes(provider)) {
          return NextResponse.json({
            success: true,
            provider,
            transactionId,
            orderId,
            status: 'completed',
            demo: true,
            message: '데모 모드 결제 승인',
          });
        }

        const result = await paymentManager.confirmPayment(
          provider,
          transactionId,
          orderId,
          amount,
          paymentMethodId ? { paymentMethodId } : undefined
        );
        return NextResponse.json(result);
      }

      // 환불 처리
      case 'refund': {
        const { 
          provider, 
          transactionId, 
          amount,
          reason,
        } = body as {
          provider: PaymentProvider;
          transactionId: string;
          amount?: number;
          reason?: string;
        };

        // 환불은 관리자 또는 판매자만 가능
        const userRole = session.user.role ?? '';
        if (!['ADMIN', 'SELLER'].includes(userRole)) {
          return NextResponse.json(
            { error: '환불 권한이 없습니다.' },
            { status: 403 }
          );
        }

        if (!provider || !transactionId) {
          return NextResponse.json(
            { error: '필수 필드가 누락되었습니다.' },
            { status: 400 }
          );
        }

        const availableProviders = paymentManager.getAvailableProviders();
        if (!availableProviders.includes(provider)) {
          return NextResponse.json({
            success: true,
            refundId: `DEMO-REFUND-${Date.now()}`,
            amount: amount || 0,
            status: 'completed',
            demo: true,
            message: '데모 모드 환불',
          });
        }

        const result = await paymentManager.refund(provider, {
          transactionId,
          amount,
          reason,
        });
        return NextResponse.json(result);
      }

      // 결제 조회
      case 'get': {
        const { provider, transactionId } = body as {
          provider: PaymentProvider;
          transactionId: string;
        };

        if (!provider || !transactionId) {
          return NextResponse.json(
            { error: '필수 필드가 누락되었습니다.' },
            { status: 400 }
          );
        }

        const availableProviders = paymentManager.getAvailableProviders();
        if (!availableProviders.includes(provider)) {
          return NextResponse.json({
            success: true,
            provider,
            transactionId,
            status: 'completed',
            demo: true,
          });
        }

        const result = await paymentManager.getPayment(provider, transactionId);
        return NextResponse.json(result);
      }

      // Toss 가상계좌 발급
      case 'create-virtual-account': {
        const { 
          orderId,
          amount, 
          bank,
          customerName,
          dueDate,
        } = body as {
          orderId?: string;
          amount: number;
          bank: string;
          customerName: string;
          dueDate?: string;
        };

        if (!amount || !bank || !customerName) {
          return NextResponse.json(
            { error: '필수 필드가 누락되었습니다.' },
            { status: 400 }
          );
        }

        const availableProviders = paymentManager.getAvailableProviders();
        if (!availableProviders.includes('toss')) {
          return NextResponse.json({
            success: true,
            provider: 'toss',
            transactionId: `DEMO-VA-${Date.now()}`,
            orderId: orderId || generateOrderId(),
            status: 'pending',
            amount,
            demo: true,
            virtualAccount: {
              bank,
              accountNumber: '1234567890123',
              customerName,
              dueDate: dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            },
          });
        }

        // 실제 Toss API 호출은 PaymentManager 내부에서 처리
        return NextResponse.json({
          error: '가상계좌 발급은 Toss Payments SDK를 통해 처리해주세요.',
        }, { status: 400 });
      }

      default:
        return NextResponse.json(
          { error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Payment provider API error:', error);
      return NextResponse.json(
        { error: '결제 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}

// GET: 결제 정보 조회
export async function GET(request: NextRequest) {
  return withSecurity(request, async (req) => {
    const context = securityLogger.extractContext(req);

    // Rate Limit 체크 (api config: 1분 100회)
    const rateLimitResult = rateLimit.check(context.ip, 'api');
    if (!rateLimitResult.allowed) {
      securityLogger.log({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'medium',
        ip: context.ip,
        userAgent: context.userAgent,
        details: { endpoint: '/api/payment/providers', action: 'GET' },
      });
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429, headers: rateLimit.headers(rateLimitResult) }
      );
    }

    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json(
          { error: '로그인이 필요합니다.' },
          { status: 401 }
        );
      }

      const searchParams = req.nextUrl.searchParams;
      const type = searchParams.get('type') || 'providers';

      const paymentManager = getPaymentManager();

    switch (type) {
      // 사용 가능한 결제 제공자 목록
      case 'providers': {
        const providers = paymentManager.getAvailableProviders();
        
        // 각 제공자별 정보
        const providerInfo = {
          paypal: {
            id: 'paypal',
            name: 'PayPal',
            description: '글로벌 온라인 결제',
            currencies: ['USD', 'EUR', 'JPY', 'CNY'],
            methods: ['paypal'],
            available: providers.includes('paypal'),
            icon: '💳',
          },
          toss: {
            id: 'toss',
            name: 'Toss Payments',
            description: '국내 간편 결제',
            currencies: ['KRW'],
            methods: ['card', 'bank_transfer', 'virtual_account', 'toss', 'kakao', 'naver'],
            available: providers.includes('toss'),
            icon: '🔵',
          },
          stripe: {
            id: 'stripe',
            name: 'Stripe',
            description: '글로벌 카드 결제',
            currencies: ['USD', 'EUR', 'JPY', 'KRW'],
            methods: ['card', 'apple_pay', 'google_pay'],
            available: providers.includes('stripe'),
            icon: '💜',
          },
        };

        return NextResponse.json({
          providers: Object.values(providerInfo),
          available: providers,
          recommended: {
            KRW: paymentManager.getRecommendedProvider('KRW'),
            USD: paymentManager.getRecommendedProvider('USD'),
          },
        });
      }

      // 클라이언트 키 조회 (Toss, Stripe)
      case 'client-keys': {
        const keys: Record<string, string | null> = {
          toss: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || null,
          stripe: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
        };

        return NextResponse.json({ keys });
      }

      // 지원 은행 목록 (가상계좌용)
      case 'banks': {
        const banks = [
          { code: '004', name: 'KB국민은행' },
          { code: '011', name: 'NH농협은행' },
          { code: '020', name: '우리은행' },
          { code: '023', name: 'SC제일은행' },
          { code: '027', name: '한국씨티은행' },
          { code: '032', name: '대구은행' },
          { code: '034', name: '광주은행' },
          { code: '035', name: '제주은행' },
          { code: '037', name: '전북은행' },
          { code: '039', name: '경남은행' },
          { code: '045', name: '새마을금고' },
          { code: '048', name: '신협' },
          { code: '071', name: '우체국' },
          { code: '081', name: '하나은행' },
          { code: '088', name: '신한은행' },
          { code: '089', name: 'K뱅크' },
          { code: '090', name: '카카오뱅크' },
          { code: '092', name: '토스뱅크' },
        ];

        return NextResponse.json({ banks });
      }

      // 환율 정보 (간이)
      case 'exchange-rates': {
        // 실제 구현시에는 환율 API 사용
        const rates = {
          base: 'KRW',
          timestamp: new Date().toISOString(),
          rates: {
            USD: 1300,
            EUR: 1400,
            JPY: 9,
            CNY: 180,
          },
        };

        return NextResponse.json(rates);
      }

      // 데모 결제 테스트
      case 'demo': {
        const demoPayment = {
          success: true,
          provider: 'toss' as PaymentProvider,
          transactionId: `DEMO-${Date.now()}`,
          orderId: generateOrderId(),
          status: 'completed',
          amount: 10000,
          currency: 'KRW' as Currency,
          paymentMethod: 'card',
          paidAt: new Date().toISOString(),
          demo: true,
          message: '데모 결제 정보입니다.',
        };

        return NextResponse.json(demoPayment);
      }

      default:
        return NextResponse.json(
          { error: '지원하지 않는 타입입니다.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Payment provider API error:', error);
      return NextResponse.json(
        { error: '조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}
