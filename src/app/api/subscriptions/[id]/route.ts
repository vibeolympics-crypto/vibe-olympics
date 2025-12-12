import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { 
  triggerSubscriptionCancelledNotification 
} from "@/lib/notification-triggers";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 구독 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                displayName: true,
                image: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        paymentRetries: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "구독을 찾을 수 없습니다" }, { status: 404 });
    }

    // 본인 구독만 조회 가능
    if (subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("구독 조회 오류:", error);
    return NextResponse.json(
      { error: "구독 정보를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 구독 상태 변경 (일시정지/재개/취소)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const { action, reason, billingKey, paymentMethod } = await request.json();

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: "구독을 찾을 수 없습니다" }, { status: 404 });
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    let updateData: {
      status?: SubscriptionStatus;
      cancelledAt?: Date | null;
      cancelReason?: string | null;
      billingKey?: string;
      paymentMethod?: string;
    } = {};
    let message = "";

    switch (action) {
      case "pause":
        // 일시정지
        if (subscription.status !== "ACTIVE") {
          return NextResponse.json(
            { error: "활성 구독만 일시정지할 수 있습니다" },
            { status: 400 }
          );
        }
        updateData = { status: "PAUSED" };
        message = "구독이 일시정지되었습니다";
        break;

      case "resume":
        // 재개
        if (subscription.status !== "PAUSED") {
          return NextResponse.json(
            { error: "일시정지된 구독만 재개할 수 있습니다" },
            { status: 400 }
          );
        }
        updateData = { status: "ACTIVE" };
        message = "구독이 재개되었습니다";
        break;

      case "cancel":
        // 취소 (현재 기간 종료 시 만료)
        if (subscription.status === "CANCELLED" || subscription.status === "EXPIRED") {
          return NextResponse.json(
            { error: "이미 취소되었거나 만료된 구독입니다" },
            { status: 400 }
          );
        }
        updateData = {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason || null,
        };
        message = "구독이 취소되었습니다. 현재 기간이 종료되면 만료됩니다.";
        
        // 플랜 구독자 수 감소
        await prisma.subscriptionPlan.update({
          where: { id: subscription.planId },
          data: { subscriberCount: { decrement: 1 } },
        });

        // 구독 취소 알림 트리거
        await triggerSubscriptionCancelledNotification({
          userId: subscription.userId,
          planName: subscription.plan.name,
          cancelDate: new Date().toLocaleDateString("ko-KR"),
          endDate: new Date(subscription.currentPeriodEnd).toLocaleDateString("ko-KR"),
          reason: reason || undefined,
        });
        break;

      case "update-payment":
        // 결제 수단 변경
        if (!billingKey) {
          return NextResponse.json(
            { error: "새 결제 수단 정보가 필요합니다" },
            { status: 400 }
          );
        }
        updateData = {
          billingKey,
          paymentMethod: paymentMethod || subscription.paymentMethod,
        };
        message = "결제 수단이 변경되었습니다";
        break;

      default:
        return NextResponse.json(
          { error: "올바른 액션을 지정해주세요 (pause/resume/cancel/update-payment)" },
          { status: 400 }
        );
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: { plan: true },
    });

    return NextResponse.json({
      subscription: updatedSubscription,
      message,
    });
  } catch (error) {
    console.error("구독 상태 변경 오류:", error);
    return NextResponse.json(
      { error: "구독 상태 변경 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 구독 즉시 해지 (환불 처리)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: "구독을 찾을 수 없습니다" }, { status: 404 });
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    if (subscription.status === "EXPIRED") {
      return NextResponse.json(
        { error: "이미 만료된 구독입니다" },
        { status: 400 }
      );
    }

    // 즉시 만료 처리
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: "EXPIRED",
        cancelledAt: new Date(),
        cancelReason: "즉시 해지",
        currentPeriodEnd: new Date(),
        nextBillingDate: null,
      },
    });

    // 플랜 구독자 수 감소 (아직 감소 안 된 경우)
    if (subscription.status !== "CANCELLED") {
      await prisma.subscriptionPlan.update({
        where: { id: subscription.planId },
        data: { subscriberCount: { decrement: 1 } },
      });
    }

    // TODO: 환불 로직 추가 (일할 계산)
    // const remainingDays = calculateRemainingDays(subscription);
    // const refundAmount = calculateRefundAmount(subscription, remainingDays);
    // await processRefund(subscription, refundAmount);

    return NextResponse.json({
      subscription: updatedSubscription,
      message: "구독이 즉시 해지되었습니다",
      // refundAmount,
    });
  } catch (error) {
    console.error("구독 즉시 해지 오류:", error);
    return NextResponse.json(
      { error: "구독 해지 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
