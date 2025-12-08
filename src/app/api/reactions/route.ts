import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TargetType, ReactionType } from "@prisma/client";

// GET: 특정 콘텐츠의 반응 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType") as TargetType;
    const targetId = searchParams.get("targetId");
    const _type = searchParams.get("type") as ReactionType | null; // 향후 필터링에 사용 예정

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "targetType과 targetId가 필요합니다" },
        { status: 400 }
      );
    }

    // 유효한 TargetType인지 확인
    if (!Object.values(TargetType).includes(targetType)) {
      return NextResponse.json(
        { error: "유효하지 않은 targetType입니다" },
        { status: 400 }
      );
    }

    // 현재 사용자 확인 (로그인 여부)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 반응 수 조회
    const reactionCounts = await prisma.reaction.groupBy({
      by: ["type"],
      where: {
        targetType,
        targetId,
      },
      _count: {
        type: true,
      },
    });

    // 반응 수를 객체로 변환
    const counts: Record<ReactionType, number> = {
      LIKE: 0,
      RECOMMEND: 0,
      HELPFUL: 0,
      BOOKMARK: 0,
    };

    reactionCounts.forEach((r) => {
      counts[r.type] = r._count.type;
    });

    // 현재 사용자의 반응 상태 조회
    let userReactions: ReactionType[] = [];
    if (userId) {
      const userReactionData = await prisma.reaction.findMany({
        where: {
          userId,
          targetType,
          targetId,
        },
        select: {
          type: true,
        },
      });
      userReactions = userReactionData.map((r) => r.type);
    }

    return NextResponse.json({
      counts,
      userReactions,
      targetType,
      targetId,
    });
  } catch (error) {
    console.error("반응 조회 오류:", error);
    return NextResponse.json(
      { error: "반응을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 반응 토글 (추가/제거)
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
    const { targetType, targetId, type } = body;

    // 필수 필드 확인
    if (!targetType || !targetId || !type) {
      return NextResponse.json(
        { error: "targetType, targetId, type이 필요합니다" },
        { status: 400 }
      );
    }

    // 유효한 enum 값인지 확인
    if (!Object.values(TargetType).includes(targetType)) {
      return NextResponse.json(
        { error: "유효하지 않은 targetType입니다" },
        { status: 400 }
      );
    }

    if (!Object.values(ReactionType).includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 반응 type입니다" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // 기존 반응 확인
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId_type: {
          userId,
          targetType,
          targetId,
          type,
        },
      },
    });

    let action: "added" | "removed";

    if (existingReaction) {
      // 이미 있으면 삭제 (토글)
      await prisma.reaction.delete({
        where: {
          id: existingReaction.id,
        },
      });
      action = "removed";
    } else {
      // 없으면 추가
      await prisma.reaction.create({
        data: {
          userId,
          targetType,
          targetId,
          type,
        },
      });
      action = "added";
    }

    // 업데이트된 반응 수 조회
    const reactionCounts = await prisma.reaction.groupBy({
      by: ["type"],
      where: {
        targetType,
        targetId,
      },
      _count: {
        type: true,
      },
    });

    const counts: Record<ReactionType, number> = {
      LIKE: 0,
      RECOMMEND: 0,
      HELPFUL: 0,
      BOOKMARK: 0,
    };

    reactionCounts.forEach((r) => {
      counts[r.type] = r._count.type;
    });

    // 현재 사용자의 반응 상태
    const userReactionData = await prisma.reaction.findMany({
      where: {
        userId,
        targetType,
        targetId,
      },
      select: {
        type: true,
      },
    });
    const userReactions = userReactionData.map((r) => r.type);

    return NextResponse.json({
      action,
      counts,
      userReactions,
      targetType,
      targetId,
    });
  } catch (error) {
    console.error("반응 토글 오류:", error);
    return NextResponse.json(
      { error: "반응을 처리하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 특정 반응 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType") as TargetType;
    const targetId = searchParams.get("targetId");
    const type = searchParams.get("type") as ReactionType;

    if (!targetType || !targetId || !type) {
      return NextResponse.json(
        { error: "targetType, targetId, type이 필요합니다" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    await prisma.reaction.deleteMany({
      where: {
        userId,
        targetType,
        targetId,
        type,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("반응 삭제 오류:", error);
    return NextResponse.json(
      { error: "반응을 삭제하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
