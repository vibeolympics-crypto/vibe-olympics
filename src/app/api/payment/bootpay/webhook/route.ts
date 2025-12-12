import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Bootpay } from "@bootpay/backend-js";
import { logger } from "@/lib/logger";

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

interface WebhookPayload {
  receipt_id: string;
  order_id: string;
  price: number;
  status: number;
  purchased_at?: string;
  cancelled_at?: string;
  method_symbol?: string;
  metadata?: {
    productId?: string;
    userId?: string;
    [key: string]: unknown;
  };
}

// Bootpay 결제 상태 코드
// 0: 결제대기
// 1: 결제완료
// 2: 결제승인전
// -1: 결제진행중
// -2: 결제취소
// -3: 가상계좌발급취소

// POST: 부트페이 웹훅 처리
export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();
    
    logger.log("Bootpay 웹훅 수신:", {
      receipt_id: payload.receipt_id,
      order_id: payload.order_id,
      status: payload.status,
    });

    // 결제 정보 검증 (부트페이 API로 재확인)
    try {
      initBootpay();
      await Bootpay.getAccessToken();
      const verifiedPayment = await Bootpay.receiptPayment(payload.receipt_id);
      
      // 결제 정보가 일치하지 않으면 무시
      if ((verifiedPayment as { price?: number }).price !== payload.price) {
        console.error("Bootpay 웹훅: 결제 금액 불일치", {
          webhook: payload.price,
          verified: (verifiedPayment as { price?: number }).price,
        });
        return NextResponse.json({ error: "결제 정보 불일치" }, { status: 400 });
      }
    } catch (verifyError) {
      console.error("Bootpay 결제 검증 오류:", verifyError);
      return NextResponse.json({ error: "결제 검증 실패" }, { status: 400 });
    }

    // 결제 완료 처리 (status === 1)
    if (payload.status === 1) {
      const productId = payload.metadata?.productId;
      const userId = payload.metadata?.userId;

      if (productId && userId) {
        // 이미 처리된 결제인지 확인
        const existingPurchase = await prisma.purchase.findFirst({
          where: {
            paymentId: payload.receipt_id,
          },
        });

        if (!existingPurchase) {
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

          if (product) {
            // 가격 검증
            const productPrice = Number(product.price);
            if (payload.price === productPrice) {
              // 구매 기록 생성
              const purchase = await prisma.purchase.create({
                data: {
                  buyerId: userId,
                  productId: product.id,
                  amount: productPrice,
                  status: "COMPLETED",
                  paymentMethod: `BOOTPAY_${payload.method_symbol?.toUpperCase() || 'CARD'}`,
                  paymentId: payload.receipt_id,
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

              logger.log("Bootpay 웹훅: 구매 처리 완료", {
                purchaseId: purchase.id,
                productId: product.id,
                amount: productPrice,
              });
            }
          }
        }
      }
    }

    // 결제 취소 처리 (status === -2)
    if (payload.status === -2) {
      const purchase = await prisma.purchase.findFirst({
        where: {
          paymentId: payload.receipt_id,
        },
        include: {
          product: true,
        },
      });

      if (purchase && purchase.status !== "REFUNDED") {
        // 구매 상태 업데이트
        await prisma.purchase.update({
          where: { id: purchase.id },
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

        // 환불 요청 기록이 없으면 생성
        const existingRefund = await prisma.refundRequest.findFirst({
          where: { purchaseId: purchase.id },
        });

        if (!existingRefund) {
          await prisma.refundRequest.create({
            data: {
              userId: purchase.buyerId,
              purchaseId: purchase.id,
              amount: Number(purchase.amount),
              reason: "OTHER",
              reasonDetail: "웹훅을 통한 취소 알림",
              status: "APPROVED",
              processedAt: payload.cancelled_at ? new Date(payload.cancelled_at) : new Date(),
            },
          });
        }

        // 알림 생성 (구매자에게) - SYSTEM 타입 사용
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

        logger.log("Bootpay 웹훅: 환불 처리 완료", {
          purchaseId: purchase.id,
          productId: purchase.productId,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bootpay 웹훅 처리 오류:", error);
    return NextResponse.json(
      { error: "웹훅 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
