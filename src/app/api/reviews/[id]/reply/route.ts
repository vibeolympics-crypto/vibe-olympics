import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const replySchema = z.object({
  content: z.string().min(5, "Reply must be at least 5 characters").max(1000),
});

// POST: 판매자 답글 작성/수정
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
    const body = await request.json();

    // 유효성 검사
    const validation = replySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // 리뷰 및 상품 정보 확인
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          select: { sellerId: true, title: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // 판매자 권한 확인
    if (review.product.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the seller can reply to this review" },
        { status: 403 }
      );
    }

    // 답글 저장
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        sellerReply: validation.data.content,
        sellerRepliedAt: new Date(),
      },
    });

    // 리뷰 작성자에게 알림 생성
    await prisma.notification.create({
      data: {
        userId: review.userId,
        type: "SYSTEM",
        title: "Your review received a seller response",
        message: `The seller replied to your review on "${review.product.title}"`,
        data: JSON.parse(JSON.stringify({ reviewId, productId: review.productId })),
      },
    });

    return NextResponse.json({
      message: "Reply saved successfully",
      sellerReply: updatedReview.sellerReply,
      sellerRepliedAt: updatedReview.sellerRepliedAt,
    });
  } catch (error) {
    console.error("Seller reply error:", error);
    return NextResponse.json(
      { error: "Failed to save reply" },
      { status: 500 }
    );
  }
}

// DELETE: 판매자 답글 삭제
export async function DELETE(
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

    // 리뷰 및 상품 정보 확인
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          select: { sellerId: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // 판매자 권한 확인
    if (review.product.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the seller can delete this reply" },
        { status: 403 }
      );
    }

    // 답글 삭제
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        sellerReply: null,
        sellerRepliedAt: null,
      },
    });

    return NextResponse.json({
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("Delete reply error:", error);
    return NextResponse.json(
      { error: "Failed to delete reply" },
      { status: 500 }
    );
  }
}
