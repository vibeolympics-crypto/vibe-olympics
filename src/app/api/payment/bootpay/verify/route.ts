import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Bootpay } from "@bootpay/backend-js";

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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { receiptId, productId } = await request.json();

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
}
