import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// 팔로우 상태 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("targetUserId");

    if (!targetUserId) {
      return NextResponse.json(
        { error: "대상 사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 로그인하지 않은 경우
    if (!session?.user?.id) {
      return NextResponse.json({
        isFollowing: false,
        followerCount: 0,
        followingCount: 0,
      });
    }

    // 팔로우 여부 확인
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });

    // 대상 사용자의 팔로워/팔로잉 수
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId: targetUserId },
      }),
      prisma.follow.count({
        where: { followerId: targetUserId },
      }),
    ]);

    return NextResponse.json({
      isFollowing: !!follow,
      followerCount,
      followingCount,
    });
  } catch (error) {
    console.error("Follow status error:", error);
    return NextResponse.json(
      { error: "팔로우 상태를 확인하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 팔로우/언팔로우 토글 (POST)
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
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "대상 사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 자기 자신 팔로우 방지
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "자기 자신은 팔로우할 수 없습니다" },
        { status: 400 }
      );
    }

    // 대상 사용자 존재 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, isSeller: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 기존 팔로우 확인
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // 언팔로우
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });

      // 팔로워 수 조회
      const followerCount = await prisma.follow.count({
        where: { followingId: targetUserId },
      });

      return NextResponse.json({
        action: "unfollowed",
        isFollowing: false,
        followerCount,
        message: "팔로우를 취소했습니다",
      });
    } else {
      // 팔로우
      await prisma.follow.create({
        data: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      });

      // 팔로워 수 조회
      const followerCount = await prisma.follow.count({
        where: { followingId: targetUserId },
      });

      // 알림 생성 (선택적)
      try {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: "SYSTEM",
            title: "새로운 팔로워",
            message: `${session.user.name || "누군가"}님이 회원님을 팔로우하기 시작했습니다.`,
          },
        });
      } catch (notifError) {
        // 알림 실패는 무시
        console.error("Follow notification error:", notifError);
      }

      return NextResponse.json({
        action: "followed",
        isFollowing: true,
        followerCount,
        message: "팔로우했습니다",
      });
    }
  } catch (error) {
    console.error("Follow toggle error:", error);
    return NextResponse.json(
      { error: "팔로우 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
