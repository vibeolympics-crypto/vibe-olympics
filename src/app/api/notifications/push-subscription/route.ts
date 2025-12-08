import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: 푸시 구독 저장
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "유효한 구독 정보가 필요합니다" },
        { status: 400 }
      );
    }

    // 기존 구독 확인 및 업데이트/생성
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
      },
    });

    if (existingSubscription) {
      // 기존 구독 업데이트
      await prisma.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          p256dh: subscription.keys?.p256dh || null,
          auth: subscription.keys?.auth || null,
          updatedAt: new Date(),
        },
      });
    } else {
      // 새 구독 생성
      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh || null,
          auth: subscription.keys?.auth || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "푸시 알림이 구독되었습니다",
    });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "구독 저장 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 푸시 구독 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "구독 endpoint가 필요합니다" },
        { status: 400 }
      );
    }

    // 구독 삭제
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint: endpoint,
      },
    });

    return NextResponse.json({
      success: true,
      message: "푸시 알림 구독이 해제되었습니다",
    });
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    return NextResponse.json(
      { error: "구독 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 사용자의 푸시 구독 목록 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      subscriptions,
      count: subscriptions.length,
    });
  } catch (error) {
    console.error("Error fetching push subscriptions:", error);
    return NextResponse.json(
      { error: "구독 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
