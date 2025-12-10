import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Bootpay } from "@bootpay/backend-js";
import { PaymentRetryStatus } from "@prisma/client";

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
  return `RETRY-${timestamp}-${randomStr}`.toUpperCase();
}

// POST: 결제 재시도 처리 (Cron Job에서 호출)
export async function POST(request: NextRequest) {
  try {
    // API 키 인증
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { retryId } = body;

    // 특정 재시도 처리 또는 예정된 모든 재시도 처리
    let retriesToProcess;
    
    if (retryId) {
      const retry = await prisma.paymentRetry.findUnique({
        where: { id: retryId },
        include: {
          subscription: {
            include: { plan: true, user: true },
          },
        },
      });
      
      if (!retry) {
        return NextResponse.json({ error: "재시도 정보를 찾을 수 없습니다" }, { status: 404 });
      }
      
      retriesToProcess = [retry];
    } else {
      // 현재 시점에 예정된 재시도 조회
      const now = new Date();
      
      retriesToProcess = await prisma.paymentRetry.findMany({
        where: {
          status: "PENDING",
          scheduledAt: { lte: now },
        },
        include: {
          subscription: {
            include: { plan: true, user: true },
          },
        },
        orderBy: { scheduledAt: "asc" },
      });
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
      skipped: [] as string[],
    };

    for (const retry of retriesToProcess) {
      // 이미 처리된 재시도는 건너뛰기
      if (retry.status !== "PENDING") {
        results.skipped.push(retry.id);
        continue;
      }

      // 구독이 만료/취소된 경우 건너뛰기
      if (retry.subscription.status === "EXPIRED" || retry.subscription.status === "CANCELLED") {
        await prisma.paymentRetry.update({
          where: { id: retry.id },
          data: {
            status: "FAILED" as PaymentRetryStatus,
            errorMessage: "구독이 취소/만료되어 재시도 취소",
            processedAt: new Date(),
          },
        });
        results.skipped.push(retry.id);
        continue;
      }

      // 빌링키가 없는 경우 건너뛰기
      if (!retry.subscription.billingKey) {
        await prisma.paymentRetry.update({
          where: { id: retry.id },
          data: {
            status: "FAILED" as PaymentRetryStatus,
            errorMessage: "빌링키가 없습니다",
            processedAt: new Date(),
          },
        });
        results.failed.push({ id: retry.id, error: "빌링키 없음" });
        continue;
      }

      // 재시도 상태를 RETRYING으로 변경
      await prisma.paymentRetry.update({
        where: { id: retry.id },
        data: { status: "RETRYING" },
      });

      try {
        // 부트페이 빌링키 결제 요청
        initBootpay();
        await Bootpay.getAccessToken();

        const orderId = generateOrderId();
        const price = Number(retry.amount);

        const paymentResponse = await Bootpay.requestSubscribePayment({
          billing_key: retry.subscription.billingKey,
          order_name: `${retry.subscription.plan.name} 구독 재결제 (${retry.attemptNumber}차)`,
          price,
          order_id: orderId,
          tax_free: 0,
          user: {
            username: retry.subscription.user.name || "",
            email: retry.subscription.user.email || "",
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
          const newPeriodEnd = new Date(retry.subscription.currentPeriodEnd);
          
          if (retry.subscription.plan.interval === "MONTHLY") {
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
          } else {
            newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
          }

          // 구독 업데이트 (활성 상태로 복구)
          await prisma.subscription.update({
            where: { id: retry.subscriptionId },
            data: {
              status: "ACTIVE",
              currentPeriodStart: retry.subscription.currentPeriodEnd,
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
              subscriptionId: retry.subscriptionId,
              amount: price,
              currency: retry.subscription.plan.currency,
              paymentMethod: retry.subscription.paymentMethod,
              receiptId: paymentResult.receipt_id,
              orderId,
              periodStart: retry.subscription.currentPeriodEnd,
              periodEnd: newPeriodEnd,
              status: "COMPLETED",
            },
          });

          // 재시도 성공 처리
          await prisma.paymentRetry.update({
            where: { id: retry.id },
            data: {
              status: "SUCCEEDED",
              receiptId: paymentResult.receipt_id,
              processedAt: now,
            },
          });

          results.success.push(retry.id);
        } else {
          // 결제 실패
          throw new Error(paymentResult.message || "결제 실패");
        }
      } catch (paymentError) {
        const error = paymentError as Error;
        console.error(`결제 재시도 실패 (${retry.id}):`, error);

        // 재시도 실패 처리
        await prisma.paymentRetry.update({
          where: { id: retry.id },
          data: {
            status: "FAILED",
            errorMessage: error.message,
            processedAt: new Date(),
          },
        });

        // 다음 재시도 스케줄링 (최대 재시도 횟수 미만인 경우)
        if (retry.attemptNumber < retry.maxAttempts) {
          const nextAttempt = retry.attemptNumber + 1;
          const retryDelays = [1, 3, 7]; // 1일, 3일, 7일 후
          const delayDays = retryDelays[nextAttempt - 1] || 7;
          
          const scheduledAt = new Date();
          scheduledAt.setDate(scheduledAt.getDate() + delayDays);

          await prisma.paymentRetry.create({
            data: {
              subscriptionId: retry.subscriptionId,
              attemptNumber: nextAttempt,
              maxAttempts: retry.maxAttempts,
              amount: retry.amount,
              status: "PENDING",
              scheduledAt,
            },
          });
        } else {
          // 최대 재시도 횟수 초과 - 구독 만료
          await prisma.subscription.update({
            where: { id: retry.subscriptionId },
            data: {
              status: "EXPIRED",
              cancelReason: "결제 실패로 인한 자동 만료",
            },
          });

          // 플랜 구독자 수 감소
          await prisma.subscriptionPlan.update({
            where: { id: retry.subscription.planId },
            data: { subscriberCount: { decrement: 1 } },
          });

          // TODO: 구독 만료 알림 발송
          // await sendSubscriptionExpiredNotification(retry.subscription);
        }

        results.failed.push({
          id: retry.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      processed: retriesToProcess.length,
      results,
    });
  } catch (error) {
    console.error("결제 재시도 처리 오류:", error);
    return NextResponse.json(
      { error: "결제 재시도 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 예정된 재시도 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PaymentRetryStatus | null;
    const subscriptionId = searchParams.get("subscriptionId");

    const where = {
      ...(status && { status }),
      ...(subscriptionId && { subscriptionId }),
    };

    const retries = await prisma.paymentRetry.findMany({
      where,
      include: {
        subscription: {
          include: {
            plan: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({
      count: retries.length,
      retries,
    });
  } catch (error) {
    console.error("재시도 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "재시도 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
