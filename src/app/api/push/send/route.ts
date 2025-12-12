import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * POST /api/push/send
 * 푸시 알림 전송 (관리자 전용)
 * 
 * 참고: 실제 푸시 전송은 web-push 패키지 설치 후 구현
 * 현재는 구독 정보 조회 및 로깅만 수행
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
    
    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      title,
      body: messageBody,
      userId,
    } = body;
    
    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "제목과 본문이 필요합니다." },
        { status: 400 }
      );
    }
    
    // 대상 구독 조회
    const whereCondition: { userId?: string } = {};
    
    if (userId) {
      whereCondition.userId = userId;
    }
    
    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereCondition,
    });
    
    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "전송할 구독자가 없습니다.",
      });
    }
    
    // 푸시 알림 전송 (web-push 패키지 필요)
    // TODO: npm install web-push 후 실제 전송 구현
    // 현재는 시뮬레이션만 수행
    
    const successful = subscriptions.length;
    const failed = 0;
    
    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
      message: "푸시 알림 전송이 요청되었습니다. (실제 전송은 web-push 설정 필요)",
    });
  } catch (error) {
    console.error("Push send error:", error);
    return NextResponse.json(
      { error: "푸시 알림 전송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/send
 * 푸시 알림 구독자 통계 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }
    
    // 구독자 통계
    const totalSubscriptions = await prisma.pushSubscription.count();
    
    const subscriptionsByDate = await prisma.pushSubscription.groupBy({
      by: ['createdAt'],
      _count: true,
      orderBy: { createdAt: 'desc' },
      take: 7,
    });
    
    return NextResponse.json({
      totalSubscriptions,
      recentSubscriptions: subscriptionsByDate,
    });
  } catch (error) {
    console.error("Get push stats error:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
