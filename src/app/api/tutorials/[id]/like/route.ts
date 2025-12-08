import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { TargetType, ReactionType } from "@prisma/client";

// POST: 좋아요 토글 - Reaction 시스템 사용
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 튜토리얼 존재 확인
    const tutorial = await prisma.tutorial.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!tutorial) {
      return NextResponse.json(
        { error: "튜토리얼을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 기존 Reaction 확인 (통합 반응 시스템)
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId_type: {
          userId: session.user.id,
          targetType: TargetType.TUTORIAL,
          targetId: id,
          type: ReactionType.LIKE,
        },
      },
    });

    let isLiked: boolean;

    if (existingReaction) {
      // 좋아요 취소
      await prisma.reaction.delete({
        where: { id: existingReaction.id },
      });
      isLiked = false;
    } else {
      // 좋아요 추가
      await prisma.reaction.create({
        data: {
          userId: session.user.id,
          targetType: TargetType.TUTORIAL,
          targetId: id,
          type: ReactionType.LIKE,
        },
      });
      isLiked = true;
    }

    // 좋아요 개수 업데이트 (Reaction 테이블 기준)
    const likeCount = await prisma.reaction.count({
      where: {
        targetType: TargetType.TUTORIAL,
        targetId: id,
        type: ReactionType.LIKE,
      },
    });

    await prisma.tutorial.update({
      where: { id },
      data: { likeCount },
    });

    return NextResponse.json({
      isLiked,
      likeCount,
    });
  } catch (error) {
    console.error("좋아요 토글 오류:", error);
    return NextResponse.json(
      { error: "좋아요 처리에 실패했습니다" },
      { status: 500 }
    );
  }
}
