import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { triggerSubscriptionWelcomeNotification } from "@/lib/notification-triggers";

// GET: 내 구독 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as SubscriptionStatus | null;

    const where = {
      userId: session.user.id,
      ...(status && { status }),
    };

    const subscriptions = await prisma.subscription.findMany({
      where,
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
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("구독 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "구독 목록을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 구독 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { planId, billingKey, paymentMethod } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "구독 플랜 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 플랜 조회
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "존재하지 않는 구독 플랜입니다" },
        { status: 404 }
      );
    }

    if (!plan.isActive || !plan.isPublic) {
      return NextResponse.json(
        { error: "현재 구독할 수 없는 플랜입니다" },
        { status: 400 }
      );
    }

    // 기존 구독 확인
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        userId_planId: {
          userId: session.user.id,
          planId,
        },
      },
    });

    if (existingSubscription) {
      if (existingSubscription.status === "ACTIVE") {
        return NextResponse.json(
          { error: "이미 구독 중인 플랜입니다" },
          { status: 400 }
        );
      }
      
      // 취소된/만료된 구독이면 재활성화
      if (existingSubscription.status === "CANCELLED" || existingSubscription.status === "EXPIRED") {
        const now = new Date();
        const periodEnd = new Date(now);
        
        if (plan.interval === "MONTHLY") {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        const reactivatedSubscription = await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: "ACTIVE",
            billingKey,
            paymentMethod,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            nextBillingDate: periodEnd,
            cancelledAt: null,
            cancelReason: null,
          },
          include: { plan: true },
        });

        // 플랜 구독자 수 증가
        await prisma.subscriptionPlan.update({
          where: { id: planId },
          data: { subscriberCount: { increment: 1 } },
        });

        return NextResponse.json({
          subscription: reactivatedSubscription,
          message: "구독이 재활성화되었습니다",
        });
      }
    }

    // 새 구독 생성
    const now = new Date();
    const periodStart = now;
    let periodEnd = new Date(now);
    let trialStart = null;
    let trialEnd = null;
    let nextBillingDate = new Date(now);

    // 트라이얼 기간 처리
    if (plan.trialDays > 0) {
      trialStart = now;
      trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + plan.trialDays);
      periodEnd = trialEnd;
      nextBillingDate = trialEnd;
    } else {
      if (plan.interval === "MONTHLY") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }
      nextBillingDate = periodEnd;
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId,
        billingKey,
        paymentMethod,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialStart,
        trialEnd,
        isTrialUsed: plan.trialDays > 0,
        status: "ACTIVE",
        nextBillingDate,
      },
      include: { plan: true },
    });

    // 플랜 구독자 수 증가
    await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { subscriberCount: { increment: 1 } },
    });

    // 구독 환영 알림 트리거
    const features = Array.isArray(plan.features) 
      ? (plan.features as string[])
      : [];
    
    await triggerSubscriptionWelcomeNotification({
      userId: session.user.id,
      planName: plan.name,
      price: Number(plan.price),
      billingCycle: plan.interval,
      features,
      nextBillingDate: nextBillingDate.toLocaleDateString("ko-KR"),
    });

    return NextResponse.json({
      subscription,
      message: plan.trialDays > 0 
        ? `${plan.trialDays}일 무료 체험이 시작되었습니다`
        : "구독이 시작되었습니다",
    }, { status: 201 });

  } catch (error) {
    console.error("구독 생성 오류:", error);
    return NextResponse.json(
      { error: "구독 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
