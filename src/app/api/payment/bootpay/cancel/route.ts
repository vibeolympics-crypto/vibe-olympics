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

// POST: 결제 취소 (환불) 처리
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { purchaseId, reason } = await request.json();

    if (!purchaseId) {
      return NextResponse.json(
        { error: "구매 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 구매 정보 조회
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            sellerId: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "구매 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 본인 구매인지 또는 판매자인지 확인
    const isBuyer = purchase.buyerId === session.user.id;
    const isSeller = purchase.product.sellerId === session.user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: "환불 요청 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 이미 환불된 주문인지 확인
    if (purchase.status === "REFUNDED") {
      return NextResponse.json(
        { error: "이미 환불된 주문입니다." },
        { status: 400 }
      );
    }

    // 결제 ID 확인 (Bootpay로 결제된 경우)
    if (!purchase.paymentId || !purchase.paymentMethod?.startsWith("BOOTPAY_")) {
      return NextResponse.json(
        { error: "Bootpay 결제가 아니거나 결제 정보가 없습니다." },
        { status: 400 }
      );
    }

    // 부트페이 환불 요청
    try {
      initBootpay();
      await Bootpay.getAccessToken();
      
      const cancelResponse = await Bootpay.cancelPayment({
        receipt_id: purchase.paymentId,
        cancel_price: Number(purchase.amount),
        cancel_username: session.user.name || "사용자",
        cancel_message: reason || "사용자 요청에 의한 환불",
      });

      // cancelResponse를 unknown으로 캐스팅 후 필요한 속성 접근
      const response = cancelResponse as unknown as {
        status?: number;
        status_locale?: string;
        cancelled_price?: number;
        cancelled_at?: string | Date;
      };

      // 환불 상태 확인 (status -2 = 결제취소)
      if (response.status !== -2) {
        return NextResponse.json(
          { 
            error: "환불 처리에 실패했습니다.", 
            status: response.status_locale 
          },
          { status: 400 }
        );
      }

      // 구매 상태 업데이트
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: "REFUNDED",
        },
      });

      // 상품 판매 수 감소
      await prisma.product.update({
        where: { id: purchase.productId },
        data: {
          salesCount: { decrement: 1 },
        },
      });

      // 환불 요청 기록 생성
      await prisma.refundRequest.create({
        data: {
          userId: purchase.buyerId,
          purchaseId: purchase.id,
          amount: Number(purchase.amount),
          reason: "OTHER",
          reasonDetail: reason || "사용자 요청에 의한 환불",
          status: "APPROVED",
          processedAt: new Date(),
          processedBy: session.user.id,
        },
      });

      // 알림 생성 (구매자에게) - SYSTEM 타입 사용
      if (isSeller) {
        await prisma.notification.create({
          data: {
            userId: purchase.buyerId,
            type: "SYSTEM",
            title: "환불 완료",
            message: `${purchase.product.title} 상품의 환불이 완료되었습니다.`,
            data: {
              purchaseId: purchase.id,
              productId: purchase.productId,
            },
          },
        });
      }

      // 알림 생성 (판매자에게) - SYSTEM 타입 사용
      if (isBuyer) {
        await prisma.notification.create({
          data: {
            userId: purchase.product.sellerId,
            type: "SYSTEM",
            title: "환불 처리됨",
            message: `${purchase.product.title} 상품이 환불 처리되었습니다.`,
            data: {
              purchaseId: purchase.id,
              productId: purchase.productId,
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "환불이 완료되었습니다.",
        refund: {
          amount: response.cancelled_price,
          cancelledAt: response.cancelled_at,
        },
      });
    } catch (bootpayError) {
      console.error("Bootpay 환불 API 오류:", bootpayError);
      return NextResponse.json(
        { error: "PG사 환불 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("환불 처리 오류:", error);
    return NextResponse.json(
      { error: "환불 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
