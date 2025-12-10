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

// POST: 빌링키 발급 (정기 결제용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { receiptId, subscriptionId } = await request.json();

    if (!receiptId) {
      return NextResponse.json(
        { error: "영수증 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 부트페이 빌링키 발급 확인
    initBootpay();
    await Bootpay.getAccessToken();
    
    // 빌링키 조회
    const billingResponse = await Bootpay.lookupBillingKey(receiptId);
    
    if (!billingResponse || !(billingResponse as { billing_key?: string }).billing_key) {
      return NextResponse.json(
        { error: "빌링키 발급에 실패했습니다" },
        { status: 400 }
      );
    }

    const billingKey = (billingResponse as { billing_key: string }).billing_key;
    const paymentMethod = (billingResponse as { method_symbol?: string }).method_symbol || "card";

    // 구독에 빌링키 저장
    if (subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (subscription && subscription.userId === session.user.id) {
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            billingKey,
            paymentMethod,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      billingKey,
      paymentMethod,
    });
  } catch (error) {
    console.error("빌링키 발급 오류:", error);
    return NextResponse.json(
      { error: "빌링키 발급 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
