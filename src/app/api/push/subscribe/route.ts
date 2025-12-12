import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// VAPID 키 설정
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * POST /api/push/subscribe
 * 푸시 알림 구독 등록
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { subscription } = body;
    
    if (!subscription?.endpoint) {
      return NextResponse.json(
        { error: "유효한 구독 정보가 필요합니다." },
        { status: 400 }
      );
    }
    
    // 기존 구독 확인
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
      },
    });
    
    if (existing) {
      // 구독 업데이트
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          updatedAt: new Date(),
        },
      });
      
      return NextResponse.json({
        success: true,
        message: "구독이 업데이트되었습니다.",
        id: existing.id,
      });
    }
    
    // 새 구독 생성
    const newSubscription = await prisma.pushSubscription.create({
      data: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "푸시 알림 구독이 완료되었습니다.",
      id: newSubscription.id,
    });
  } catch (error) {
    console.error("Push subscription error:", error);
    return NextResponse.json(
      { error: "구독 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * 푸시 알림 구독 취소
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    
    if (endpoint) {
      // 특정 구독 취소
      await prisma.pushSubscription.deleteMany({
        where: {
          userId: session.user.id,
          endpoint,
        },
      });
    } else {
      // 모든 구독 취소
      await prisma.pushSubscription.deleteMany({
        where: { userId: session.user.id },
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "푸시 알림 구독이 취소되었습니다.",
    });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      { error: "구독 취소 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/subscribe
 * 구독 상태 확인
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json({
      subscriptions,
      vapidPublicKey: VAPID_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return NextResponse.json(
      { error: "구독 정보 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
