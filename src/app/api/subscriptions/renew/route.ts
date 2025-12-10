import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Bootpay } from "@bootpay/backend-js";
import { SubscriptionStatus } from "@prisma/client";
import {
  triggerSubscriptionPaymentSuccessNotification,
  triggerSubscriptionPaymentFailedNotification,
} from "@/lib/notification-triggers";

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

// 주문 ID 생성
function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `SUB-${timestamp}-${randomStr}`.toUpperCase();
}

// POST: 구독 자동 갱신 처리 (Cron Job 또는 웹훅에서 호출)
export async function POST(request: NextRequest) {
  try {
    // API 키 인증 (Cron Job 보안)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, force = false } = body;

    // 특정 구독 갱신 또는 전체 갱신 대상 조회
    let subscriptionsToRenew;
    
    if (subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, user: true },
      });
      
      if (!subscription) {
        return NextResponse.json({ error: "구독을 찾을 수 없습니다" }, { status: 404 });
      }
      
      subscriptionsToRenew = [subscription];
    } else {
      // 오늘 갱신해야 할 구독 조회
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      subscriptionsToRenew = await prisma.subscription.findMany({
        where: {
          status: force ? undefined : { in: ["ACTIVE", "PAST_DUE"] },
          nextBillingDate: {
            gte: today,
            lt: tomorrow,
          },
          billingKey: { not: null },
        },
        include: { plan: true, user: true },
      });
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
      skipped: [] as string[],
    };

    for (const subscription of subscriptionsToRenew) {
      // 취소/만료된 구독은 건너뛰기
      if (subscription.status === "CANCELLED" || subscription.status === "EXPIRED") {
        results.skipped.push(subscription.id);
        continue;
      }

      // 빌링키가 없으면 건너뛰기
      if (!subscription.billingKey) {
        results.failed.push({
          id: subscription.id,
          error: "빌링키가 없습니다",
        });
        continue;
      }

      // 트라이얼 기간이면 건너뛰기
      if (subscription.trialEnd && new Date() < subscription.trialEnd) {
        results.skipped.push(subscription.id);
        continue;
      }

      try {
        // 부트페이 빌링키 결제 요청
        initBootpay();
        await Bootpay.getAccessToken();

        const orderId = generateOrderId();
        const price = Number(subscription.plan.price);

        const paymentResponse = await Bootpay.requestSubscribePayment({
          billing_key: subscription.billingKey,
          order_name: `${subscription.plan.name} 구독 갱신`,
          price,
          order_id: orderId,
          tax_free: 0,
          user: {
            username: subscription.user.name || "",
            email: subscription.user.email || "",
          },
        });

        const paymentResult = paymentResponse as {
          receipt_id?: string;
          status?: number;
          error_code?: string;
          message?: string;
        };

        if (paymentResult.status === 1) {
          // 결제 성공
          const now = new Date();
          const newPeriodEnd = new Date(subscription.currentPeriodEnd);
          
          if (subscription.plan.interval === "MONTHLY") {
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
          } else {
            newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
          }

          // 구독 업데이트
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "ACTIVE",
              currentPeriodStart: subscription.currentPeriodEnd,
              currentPeriodEnd: newPeriodEnd,
              nextBillingDate: newPeriodEnd,
              lastBillingDate: now,
              totalPaid: { increment: price },
              paymentCount: { increment: 1 },
            },
          });

          // 결제 내역 생성
          await prisma.subscriptionPayment.create({
            data: {
              subscriptionId: subscription.id,
              amount: price,
              currency: subscription.plan.currency,
              paymentMethod: subscription.paymentMethod,
              receiptId: paymentResult.receipt_id,
              orderId,
              periodStart: subscription.currentPeriodEnd,
              periodEnd: newPeriodEnd,
              status: "COMPLETED",
            },
          });

          // 결제 성공 알림 트리거
          await triggerSubscriptionPaymentSuccessNotification({
            userId: subscription.userId,
            planName: subscription.plan.name,
            amount: price,
            paymentDate: now.toLocaleDateString("ko-KR"),
            nextBillingDate: newPeriodEnd.toLocaleDateString("ko-KR"),
            receiptId: paymentResult.receipt_id,
          });

          results.success.push(subscription.id);
        } else {
          // 결제 실패
          throw new Error(paymentResult.message || "결제 실패");
        }
      } catch (paymentError) {
        const error = paymentError as Error;
        console.error(`구독 갱신 실패 (${subscription.id}):`, error);

        // 결제 실패 처리
        await handlePaymentFailure(subscription.id, error.message);

        results.failed.push({
          id: subscription.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      processed: subscriptionsToRenew.length,
      results,
    });
  } catch (error) {
    console.error("구독 갱신 처리 오류:", error);
    return NextResponse.json(
      { error: "구독 갱신 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 결제 실패 처리
async function handlePaymentFailure(subscriptionId: string, errorMessage: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });

  if (!subscription) return;

  // 연체 상태로 변경
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "PAST_DUE" as SubscriptionStatus,
    },
  });

  // 기존 대기 중인 재시도가 있는지 확인
  const existingRetry = await prisma.paymentRetry.findFirst({
    where: {
      subscriptionId,
      status: { in: ["PENDING", "RETRYING"] },
    },
    orderBy: { attemptNumber: "desc" },
  });

  const attemptNumber = existingRetry ? existingRetry.attemptNumber + 1 : 1;
  const maxAttempts = 3;

  if (attemptNumber <= maxAttempts) {
    // 재시도 스케줄 (1일, 3일, 7일 후)
    const retryDelays = [1, 3, 7];
    const delayDays = retryDelays[attemptNumber - 1] || 7;
    
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + delayDays);

    await prisma.paymentRetry.create({
      data: {
        subscriptionId,
        attemptNumber,
        maxAttempts,
        amount: Number(subscription.plan.price),
        status: "PENDING",
        errorMessage,
        scheduledAt,
      },
    });

    // 결제 실패 알림 트리거
    await triggerSubscriptionPaymentFailedNotification({
      userId: subscription.userId,
      planName: subscription.plan.name,
      amount: Number(subscription.plan.price),
      failureReason: errorMessage,
      retryDate: scheduledAt.toLocaleDateString("ko-KR"),
      maxRetries: maxAttempts,
      currentRetry: attemptNumber,
    });
  } else {
    // 최대 재시도 횟수 초과 - 구독 만료
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "EXPIRED",
        cancelReason: "결제 실패로 인한 자동 만료",
      },
    });

    // 플랜 구독자 수 감소
    await prisma.subscriptionPlan.update({
      where: { id: subscription.planId },
      data: { subscriberCount: { decrement: 1 } },
    });

    // 최종 결제 실패 알림 (재시도 없음)
    await triggerSubscriptionPaymentFailedNotification({
      userId: subscription.userId,
      planName: subscription.plan.name,
      amount: Number(subscription.plan.price),
      failureReason: "최대 재시도 횟수를 초과하여 구독이 만료되었습니다.",
      maxRetries: maxAttempts,
      currentRetry: attemptNumber,
    });
  }
}

// GET: 갱신 대상 구독 목록 조회 (관리자/디버깅용)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "1");

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: ["ACTIVE", "PAST_DUE"] },
        nextBillingDate: {
          gte: today,
          lt: endDate,
        },
      },
      include: {
        plan: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { nextBillingDate: "asc" },
    });

    return NextResponse.json({
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    console.error("갱신 대상 조회 오류:", error);
    return NextResponse.json(
      { error: "갱신 대상 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
