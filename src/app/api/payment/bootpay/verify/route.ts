import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Bootpay } from "@bootpay/backend-js";
import {
  sendPaymentReceiptEmail,
  sendSaleNotificationEmail
} from "@/lib/email";
import {
  sendSaleNotificationToSeller,
  broadcastRealtimeSale,
} from "@/lib/socket";
import { withSecurity, rateLimit, securityLogger } from "@/lib/security";

export const dynamic = 'force-dynamic';

// 부트페이 설정
const BOOTPAY_APPLICATION_ID = process.env.BOOTPAY_REST_API_KEY;
const BOOTPAY_PRIVATE_KEY = process.env.BOOTPAY_PRIVATE_KEY;

// 부트페이 초기화
function initBootpay() {
  if (!BOOTPAY_APPLICATION_ID || !BOOTPAY_PRIVATE_KEY) {
    throw new Error("Bootpay 설정이 누락되었습니다.");
  }
  
  Bootpay.setConfiguration({
    application_id: BOOTPAY_APPLICATION_ID,
    private_key: BOOTPAY_PRIVATE_KEY,
  });
}

// 부트페이 결제 응답 타입
interface BootpayReceiptResponse {
  receipt_id: string;
  order_id: string;
  price: number;
  tax_free: number;
  cancelled_price: number;
  order_name: string;
  company_name: string;
  sandbox: boolean;
  pg: string;
  method: string;
  method_symbol: string;
  currency: string;
  status: number;
  status_locale: string;
  purchased_at: string | Date;
  cancelled_at: string | Date | null;
  requested_at: string | Date;
  metadata?: {
    productId?: string;
    [key: string]: unknown;
  };
  card_data?: {
    card_approve_no: string;
    card_no: string;
    card_quota: string;
    card_company: string;
    receipt_url: string;
  };
}

async function getBootpayPayment(receiptId: string): Promise<BootpayReceiptResponse | null> {
  try {
    initBootpay();
    await Bootpay.getAccessToken();
    const response = await Bootpay.receiptPayment(receiptId);
    return response as unknown as BootpayReceiptResponse;
  } catch (error) {
    console.error("Bootpay 결제 조회 오류:", error);
    return null;
  }
}

// POST: 결제 검증 및 구매 처리
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
        details: { endpoint: '/api/payment/bootpay/verify', action: 'POST' },
      });
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429, headers: rateLimit.headers(rateLimitResult) }
      );
    }

    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'low',
          ip: context.ip,
          userAgent: context.userAgent,
          details: { endpoint: '/api/payment/bootpay/verify', reason: 'Unauthenticated payment verification attempt' },
        });
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
      }

      const { receiptId, productId } = await req.json();

      if (!receiptId || !productId) {
        return NextResponse.json(
          { error: "결제 ID와 상품 ID가 필요합니다." },
          { status: 400 }
        );
      }

      // 부트페이 API로 결제 상태 확인
      const payment = await getBootpayPayment(receiptId);

      if (!payment) {
        return NextResponse.json(
          { error: "결제 정보를 확인할 수 없습니다." },
          { status: 400 }
        );
      }

      // 결제 상태 확인 (status 1 = 결제완료)
      if (payment.status !== 1) {
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'medium',
          ip: context.ip,
          userAgent: context.userAgent,
          userId: session.user.id,
          details: {
            endpoint: '/api/payment/bootpay/verify',
            reason: 'Payment status not completed',
            paymentStatus: payment.status,
            statusLocale: payment.status_locale,
            receiptId,
          },
        });
        return NextResponse.json(
          {
            error: "결제가 완료되지 않았습니다.",
            status: payment.status_locale
          },
          { status: 400 }
        );
      }

      // 메타데이터에서 상품 ID 확인
      const paymentProductId = payment.metadata?.productId;
      if (paymentProductId && paymentProductId !== productId) {
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'high',
          ip: context.ip,
          userAgent: context.userAgent,
          userId: session.user.id,
          details: {
            endpoint: '/api/payment/bootpay/verify',
            reason: 'Product ID mismatch',
            expectedProductId: paymentProductId,
            actualProductId: productId,
            receiptId,
          },
        });
        return NextResponse.json(
          { error: "결제 정보와 상품이 일치하지 않습니다." },
          { status: 400 }
        );
      }

      // 상품 조회
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          title: true,
          price: true,
          sellerId: true,
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: "상품을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // 가격 검증
      const productPrice = Number(product.price);
      if (payment.price !== productPrice) {
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'high',
          ip: context.ip,
          userAgent: context.userAgent,
          userId: session.user.id,
          details: {
            endpoint: '/api/payment/bootpay/verify',
            reason: 'Price mismatch',
            expectedPrice: productPrice,
            actualPrice: payment.price,
            receiptId,
            productId,
          },
        });
        console.error("결제 금액 불일치:", {
          expected: productPrice,
          actual: payment.price,
        });
        return NextResponse.json(
          { error: "결제 금액이 일치하지 않습니다." },
          { status: 400 }
        );
      }

      // 이미 구매한 상품인지 확인
      const existingPurchase = await prisma.purchase.findFirst({
        where: {
          buyerId: session.user.id,
          productId: product.id,
          status: "COMPLETED",
        },
      });

      if (existingPurchase) {
        return NextResponse.json(
          { error: "이미 구매한 상품입니다." },
          { status: 400 }
        );
      }

      // 중복 결제 확인 (동일 receiptId로 처리된 구매)
      const duplicatePayment = await prisma.purchase.findFirst({
        where: {
          paymentId: receiptId,
        },
      });

      if (duplicatePayment) {
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'medium',
          ip: context.ip,
          userAgent: context.userAgent,
          userId: session.user.id,
          details: {
            endpoint: '/api/payment/bootpay/verify',
            reason: 'Duplicate payment attempt',
            receiptId,
            existingPurchaseId: duplicatePayment.id,
          },
        });
        return NextResponse.json(
          { error: "이미 처리된 결제입니다." },
          { status: 400 }
        );
      }

      // 구매 기록 생성
      const purchase = await prisma.purchase.create({
        data: {
          buyerId: session.user.id,
          productId: product.id,
          amount: productPrice,
          status: "COMPLETED",
          paymentMethod: `BOOTPAY_${payment.method_symbol?.toUpperCase() || 'CARD'}`,
          paymentId: receiptId,
        },
      });

      // 상품 판매 수 증가
      await prisma.product.update({
        where: { id: product.id },
        data: {
          salesCount: { increment: 1 },
        },
      });

      // 알림 생성 (판매자에게)
      await prisma.notification.create({
        data: {
          userId: product.sellerId,
          type: "PURCHASE",
          title: "새로운 판매!",
          message: `${product.title} 상품이 판매되었습니다.`,
          data: {
            purchaseId: purchase.id,
            productId: product.id,
          },
        },
      });

      // 이메일 발송 (비동기 - 에러가 결제 성공에 영향 주지 않음)
      try {
        const [buyer, seller, productWithThumbnail] = await Promise.all([
          prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true },
          }),
          prisma.user.findUnique({
            where: { id: product.sellerId },
            select: { name: true, email: true },
          }),
          prisma.product.findUnique({
            where: { id: product.id },
            select: { thumbnail: true },
          }),
        ]);

        // 결제 수단 이름 매핑
        const paymentMethodNames: Record<string, string> = {
          CARD: '신용/체크카드',
          BANK: '계좌이체',
          VBANK: '가상계좌',
          PHONE: '휴대폰결제',
          KAKAO: '카카오페이',
          NAVER: '네이버페이',
          TOSS: '토스페이',
        };
        const methodName = paymentMethodNames[payment.method_symbol?.toUpperCase() || 'CARD'] || payment.method || '카드';

        // 실시간 판매 알림 (소켓) - 판매자에게
        try {
          sendSaleNotificationToSeller(product.sellerId, {
            id: purchase.id,
            productId: product.id,
            productTitle: product.title,
            productThumbnail: productWithThumbnail?.thumbnail || undefined,
            buyerName: buyer?.name || "구매자",
            price: productPrice,
            quantity: 1,
            createdAt: new Date().toISOString(),
          });

          // 관리자 실시간 피드에 브로드캐스트
          broadcastRealtimeSale({
            id: purchase.id,
            productId: product.id,
            productTitle: product.title,
            sellerId: product.sellerId,
            sellerName: seller?.name || "판매자",
            buyerName: buyer?.name || "구매자",
            price: productPrice,
            createdAt: new Date().toISOString(),
          });
        } catch (socketError) {
          console.error("실시간 알림 발송 실패:", socketError);
        }

        // 구매자에게 결제 영수증 이메일
        if (buyer?.email) {
          await sendPaymentReceiptEmail(buyer.email, {
            buyerName: buyer.name || "고객",
            productTitle: product.title,
            productId: product.id,
            price: productPrice,
            paymentMethod: methodName,
            transactionId: receiptId,
            purchaseId: purchase.id,
            purchaseDate: new Date().toLocaleString("ko-KR"),
          });
        }

        // 판매자에게 판매 알림 이메일
        if (seller?.email) {
          await sendSaleNotificationEmail(seller.email, {
            sellerName: seller.name || "판매자",
            productTitle: product.title,
            price: productPrice,
            buyerName: buyer?.name || "구매자",
          });
        }
      } catch (emailError) {
        console.error("이메일 발송 실패 (결제는 성공):", emailError);
      }

      // 결제 성공 로깅
      securityLogger.log({
        type: 'LOGIN_SUCCESS', // 결제 성공 이벤트
        severity: 'low',
        ip: context.ip,
        userAgent: context.userAgent,
        userId: session.user.id,
        details: {
          endpoint: '/api/payment/bootpay/verify',
          event: 'PAYMENT_SUCCESS',
          purchaseId: purchase.id,
          productId: product.id,
          amount: productPrice,
          receiptId,
        },
      });

      return NextResponse.json({
        success: true,
        purchaseId: purchase.id,
        purchase: {
          id: purchase.id,
          status: purchase.status,
        },
        message: "결제가 완료되었습니다.",
      });
    } catch (error) {
      console.error("Bootpay 결제 확인 오류:", error);
      return NextResponse.json(
        { error: "결제 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  });
}
