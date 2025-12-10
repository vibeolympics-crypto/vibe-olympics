import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 기본 알림 설정값
const DEFAULT_NOTIFICATION_SETTINGS = {
  // 이메일 알림
  email: {
    enabled: true,          // 이메일 알림 전체 활성화
    sales: true,            // 판매 알림
    reviews: true,          // 리뷰 알림
    purchases: true,        // 구매 확인
    marketing: false,       // 마케팅 알림
    community: true,        // 커뮤니티 알림
    followers: true,        // 팔로우 알림
    newsletter: false,      // 뉴스레터
    wishlistSale: true,     // 위시리스트 상품 할인
    weeklyDigest: false,    // 주간 요약
    subscriptionReminder: true, // 구독 만료 알림
    paymentFailed: true,    // 결제 실패 알림
  },
  // 푸시/인앱 알림
  push: {
    enabled: false,         // 푸시 알림 전체 활성화
    sales: true,            // 판매 알림
    reviews: true,          // 리뷰 알림
    purchases: true,        // 구매 확인
    marketing: false,       // 마케팅 알림
    community: true,        // 커뮤니티 알림
    followers: true,        // 팔로우 알림
    mentions: true,         // 멘션 알림
    promotion: false,       // 프로모션/이벤트
    subscriptionReminder: true, // 구독 만료 알림
    paymentFailed: true,    // 결제 실패 알림
  },
  // 인앱 알림 (항상 표시)
  inApp: {
    enabled: true,
    all: true,
  },
};

export type NotificationSettings = typeof DEFAULT_NOTIFICATION_SETTINGS;

// GET: 알림 설정 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 저장된 설정이 없으면 기본값 반환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = (user as any).notificationSettings as NotificationSettings | null;
    
    return NextResponse.json({
      settings: settings || DEFAULT_NOTIFICATION_SETTINGS,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "알림 설정을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 알림 설정 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "유효한 설정 데이터가 필요합니다" },
        { status: 400 }
      );
    }

    // 현재 설정 가져오기
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 기존 설정과 병합
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentSettings = ((user as any).notificationSettings as NotificationSettings | null) || DEFAULT_NOTIFICATION_SETTINGS;
    const updatedSettings = {
      email: {
        ...currentSettings.email,
        ...(settings.email || {}),
      },
      push: {
        ...currentSettings.push,
        ...(settings.push || {}),
      },
      inApp: {
        ...(currentSettings.inApp || { enabled: true, all: true }),
        ...(settings.inApp || {}),
      },
    };

    // 설정 저장
    await prisma.$executeRaw`UPDATE "User" SET "notificationSettings" = ${JSON.stringify(updatedSettings)}::jsonb WHERE "id" = ${session.user.id}`;

    return NextResponse.json({
      message: "알림 설정이 저장되었습니다",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "알림 설정 저장 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
