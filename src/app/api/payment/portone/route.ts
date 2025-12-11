import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  sendPaymentReceiptEmail, 
  sendSaleNotificationEmail 
} from "@/lib/email";

// PortOne 결제 확인 API
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;

interface PortOnePaymentResponse {
  id: string;
  status: string;
  transactionId: string;
  amount: {
    total: number;
    currency: string;
  };
  method: {
    type: string;
  };
  customData?: {
    productId?: string;
  };
}

async function getPortOnePayment(paymentId: string): Promise<PortOnePaymentResponse | null> {
  if (!PORTONE_API_SECRET) {
    console.error("PortOne API Secret이 설정되지 않았습니다.");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
        },
      }
    );

    if (!response.ok) {
      console.error("PortOne API 응답 오류:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("PortOne API 호출 오류:", error);
    return null;
  }
}

// POST: 결제 확인 및 구매 처리
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { paymentId, productId } = await request.json();

    if (!paymentId || !productId) {
      return NextResponse.json(
        { error: "결제 ID와 상품 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // PortOne API로 결제 상태 확인
    const payment = await getPortOnePayment(paymentId);

    if (!payment) {
      return NextResponse.json(
        { error: "결제 정보를 확인할 수 없습니다." },
        { status: 400 }
      );
    }

    // 결제 상태 확인
    if (payment.status !== "PAID") {
      return NextResponse.json(
        { error: "결제가 완료되지 않았습니다.", status: payment.status },
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
    if (payment.amount.total !== productPrice) {
      console.error("결제 금액 불일치:", {
        expected: productPrice,
        actual: payment.amount.total,
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

    // 구매 기록 생성
    const purchase = await prisma.purchase.create({
      data: {
        buyerId: session.user.id,
        productId: product.id,
        amount: productPrice,
        status: "COMPLETED",
        paymentMethod: payment.method.type,
        paymentId: payment.transactionId || paymentId,
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
      const [buyer, seller] = await Promise.all([
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, email: true },
        }),
        prisma.user.findUnique({
          where: { id: product.sellerId },
          select: { name: true, email: true },
        }),
      ]);

      // 구매자에게 결제 영수증 이메일
      if (buyer?.email) {
        await sendPaymentReceiptEmail(buyer.email, {
          buyerName: buyer.name || "고객",
          productTitle: product.title,
          productId: product.id,
          price: productPrice,
          paymentMethod: payment.method.type,
          transactionId: payment.transactionId || paymentId,
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

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      message: "결제가 완료되었습니다.",
    });
  } catch (error) {
    console.error("PortOne 결제 확인 오류:", error);
    return NextResponse.json(
      { error: "결제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// GET: 콜백 처리 (리다이렉트 결제용)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentId = searchParams.get("paymentId");
  const code = searchParams.get("code");

  // 결제 실패
  if (code) {
    const message = searchParams.get("message") || "결제가 실패했습니다.";
    return NextResponse.redirect(
      new URL(`/marketplace?error=${encodeURIComponent(message)}`, request.url)
    );
  }

  // 결제 성공 - 클라이언트에서 확인 처리
  if (paymentId) {
    return NextResponse.redirect(
      new URL(`/checkout/confirm?paymentId=${paymentId}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/marketplace", request.url));
}
