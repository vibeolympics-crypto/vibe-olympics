import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// POST: 리뷰 도움됨 투표
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Login required" },
        { status: 401 }
      );
    }

    const reviewId = params.id;

    // 리뷰 존재 확인
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // 본인 리뷰에는 투표 불가
    if (review.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own review" },
        { status: 400 }
      );
    }

    // 이미 투표했는지 확인
    const existingVote = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      // 이미 투표한 경우 취소
      await prisma.$transaction([
        prisma.reviewHelpful.delete({
          where: { id: existingVote.id },
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: { helpfulCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({
        message: "Vote removed",
        voted: false,
        helpfulCount: review.helpfulCount - 1,
      });
    }

    // 새 투표 생성
    await prisma.$transaction([
      prisma.reviewHelpful.create({
        data: {
          reviewId,
          userId: session.user.id,
        },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      message: "Voted as helpful",
      voted: true,
      helpfulCount: review.helpfulCount + 1,
    });
  } catch (error) {
    console.error("Review helpful vote error:", error);
    return NextResponse.json(
      { error: "Failed to vote" },
      { status: 500 }
    );
  }
}

// GET: 투표 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const reviewId = params.id;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { helpfulCount: true },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    let voted = false;
    if (session?.user?.id) {
      const vote = await prisma.reviewHelpful.findUnique({
        where: {
          reviewId_userId: {
            reviewId,
            userId: session.user.id,
          },
        },
      });
      voted = !!vote;
    }

    return NextResponse.json({
      voted,
      helpfulCount: review.helpfulCount,
    });
  } catch (error) {
    console.error("Review helpful status error:", error);
    return NextResponse.json(
      { error: "Failed to get vote status" },
      { status: 500 }
    );
  }
}
