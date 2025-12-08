import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// 예약 발행 실행 (Cron Job 또는 수동 실행용)
// 내부 API 키 또는 Admin 권한 필요
export async function POST(request: NextRequest) {
  try {
    // API 키 인증 확인
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    const internalKey = process.env.INTERNAL_API_KEY;

    let isAuthorized = false;

    // 1. 내부 API 키 확인
    if (apiKey && internalKey && apiKey === internalKey) {
      isAuthorized = true;
    }

    // 2. Admin 세션 확인
    if (!isAuthorized) {
      const session = await getServerSession(authOptions);
      if (session?.user?.role === "ADMIN") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    const now = new Date();

    // 예약 시간이 지난 미발행 게시글 찾기
    const scheduledPosts = await prisma.post.findMany({
      where: {
        isPublished: false,
        scheduledAt: {
          lte: now,
        },
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
      },
    });

    // 예약 시간이 지난 미발행 튜토리얼 찾기
    const scheduledTutorials = await prisma.tutorial.findMany({
      where: {
        isPublished: false,
        // Tutorial 모델에 scheduledAt이 없으면 스킵
      },
      select: {
        id: true,
        title: true,
      },
    });

    // 게시글 발행 처리
    const publishedPostIds: string[] = [];
    for (const post of scheduledPosts) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          isPublished: true,
          publishedAt: now,
        },
      });
      publishedPostIds.push(post.id);
    }

    return NextResponse.json({
      success: true,
      processedAt: now.toISOString(),
      published: {
        posts: {
          count: publishedPostIds.length,
          ids: publishedPostIds,
        },
      },
    });
  } catch (error) {
    console.error("스케줄러 실행 오류:", error);
    return NextResponse.json(
      { error: "예약 발행 처리에 실패했습니다" },
      { status: 500 }
    );
  }
}

// GET - 예약된 콘텐츠 목록 조회 (Admin용)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Admin이 아니면 자신의 예약 콘텐츠만 조회
    const isAdmin = session.user.role === "ADMIN";
    const authorFilter = isAdmin ? {} : { authorId: session.user.id };

    const scheduledPosts = await prisma.post.findMany({
      where: {
        ...authorFilter,
        isPublished: false,
        scheduledAt: { not: null },
        isDeleted: false,
      },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        title: true,
        category: true,
        scheduledAt: true,
        createdAt: true,
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      scheduled: {
        posts: scheduledPosts,
        total: scheduledPosts.length,
      },
    });
  } catch (error) {
    console.error("예약 콘텐츠 조회 오류:", error);
    return NextResponse.json(
      { error: "예약 콘텐츠 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
