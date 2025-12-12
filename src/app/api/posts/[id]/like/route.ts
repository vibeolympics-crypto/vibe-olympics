import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { TargetType, ReactionType } from "@prisma/client";

export const dynamic = 'force-dynamic';

// 좋아요 토글 (POST) - Reaction 시스템 사용
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
    });

    if (!post) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 기존 Reaction 확인 (통합 반응 시스템)
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId_type: {
          userId: session.user.id,
          targetType: TargetType.POST,
          targetId: postId,
          type: ReactionType.LIKE,
        },
      },
    });

    if (existingReaction) {
      // 좋아요 취소
      await prisma.$transaction([
        prisma.reaction.delete({
          where: { id: existingReaction.id },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({
        liked: false,
        likeCount: post.likeCount - 1,
      });
    } else {
      // 좋아요 추가
      await prisma.$transaction([
        prisma.reaction.create({
          data: {
            userId: session.user.id,
            targetType: TargetType.POST,
            targetId: postId,
            type: ReactionType.LIKE,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        liked: true,
        likeCount: post.likeCount + 1,
      });
    }
  } catch (error) {
    console.error("Like toggle error:", error);
    return NextResponse.json(
      { error: "좋아요 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
