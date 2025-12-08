import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { NotificationType } from "@prisma/client";

// 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const skip = (page - 1) * limit;

    const whereClause = {
      userId: session.user.id,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "알림 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 알림 생성 (내부 API 또는 시스템용)
// 인증 방법: 1) 관리자 세션 2) 내부 API 키
export async function POST(request: NextRequest) {
  try {
    // 인증 확인 - 관리자 세션 또는 내부 API 키 필요
    const session = await getServerSession(authOptions);
    const apiKey = request.headers.get("x-api-key");
    const internalApiKey = process.env.INTERNAL_API_KEY;

    // 내부 API 키 검증 (서버간 통신용)
    const isValidApiKey = internalApiKey && apiKey === internalApiKey;
    
    // 관리자 세션 검증 (향후 관리자 역할 추가 시 활성화)
    // const isAdmin = session?.user?.role === "ADMIN";
    
    // 개발 환경에서는 세션만 있어도 허용 (테스트용)
    const isDevelopment = process.env.NODE_ENV === "development";
    const hasSession = !!session?.user?.id;

    if (!isValidApiKey && !(isDevelopment && hasSession)) {
      return NextResponse.json(
        { error: "인증이 필요합니다. 유효한 API 키 또는 관리자 권한이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, type, title, message, data } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // NotificationType 검증
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 알림 타입입니다." },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || null,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return NextResponse.json(
      { error: "알림 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 모든 알림 읽음 처리
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, notificationIds } = body;

    if (action === "markAllAsRead") {
      // 모든 알림 읽음 처리
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ message: "모든 알림을 읽음 처리했습니다." });
    }

    if (action === "markAsRead" && notificationIds?.length > 0) {
      // 특정 알림들 읽음 처리
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ message: "알림을 읽음 처리했습니다." });
    }

    return NextResponse.json(
      { error: "유효하지 않은 작업입니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json(
      { error: "알림 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 알림 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const deleteAll = searchParams.get("all") === "true";

    if (deleteAll) {
      // 모든 알림 삭제
      await prisma.notification.deleteMany({
        where: { userId: session.user.id },
      });

      return NextResponse.json({ message: "모든 알림을 삭제했습니다." });
    }

    if (notificationId) {
      // 특정 알림 삭제
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "알림을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      return NextResponse.json({ message: "알림을 삭제했습니다." });
    }

    return NextResponse.json(
      { error: "삭제할 알림을 지정해주세요." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to delete notifications:", error);
    return NextResponse.json(
      { error: "알림 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
