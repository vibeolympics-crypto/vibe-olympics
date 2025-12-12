import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendReviewNotificationEmail } from "@/lib/email";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// 리뷰 생성 스키마
const createReviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  title: z.string().min(2).max(100).optional(),
  content: z.string().min(10, "리뷰는 10자 이상 작성해주세요").max(2000),
});

// 리뷰 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const productId = searchParams.get("productId");
    
    // 페이지네이션 파라미터 유효성 검사
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid page parameter. Page must be a positive integer." },
        { status: 400 }
      );
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter. Limit must be between 1 and 100." },
        { status: 400 }
      );
    }
    
    const sort = searchParams.get("sort") || "latest";

    if (!productId) {
      return NextResponse.json(
        { error: "productId가 필요합니다" },
        { status: 400 }
      );
    }

    // 정렬
    let orderBy: Record<string, string> = { createdAt: "desc" };
    switch (sort) {
      case "helpful":
        orderBy = { helpfulCount: "desc" };
        break;
      case "rating-high":
        orderBy = { rating: "desc" };
        break;
      case "rating-low":
        orderBy = { rating: "asc" };
        break;
    }

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      prisma.review.count({ where: { productId } }),
      // 평점 통계
      prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // 평점별 개수
    const ratingDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { productId },
      _count: { rating: true },
    });

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
        distribution: ratingDistribution.reduce(
          (acc: Record<number, number>, item: { rating: number; _count: { rating: number } }) => {
            acc[item.rating] = item._count.rating;
            return acc;
          },
          {} as Record<number, number>
        ),
      },
    });
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json(
      { error: "리뷰를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 리뷰 생성 (POST)
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

    // 유효성 검사
    const validation = createReviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { productId, rating, title, content } = validation.data;

    // 상품 존재 확인
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sellerId: true, title: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 본인 상품에는 리뷰 불가
    if (product.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "본인 상품에는 리뷰를 작성할 수 없습니다" },
        { status: 400 }
      );
    }

    // 구매 확인
    const purchase = await prisma.purchase.findUnique({
      where: {
        buyerId_productId: {
          buyerId: session.user.id,
          productId,
        },
      },
    });

    if (!purchase || purchase.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "구매한 상품만 리뷰를 작성할 수 있습니다" },
        { status: 400 }
      );
    }

    // 이미 리뷰 작성했는지 확인
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "이미 리뷰를 작성하셨습니다" },
        { status: 400 }
      );
    }

    // 리뷰 생성 및 상품 평점 업데이트
    const [review] = await prisma.$transaction([
      prisma.review.create({
        data: {
          userId: session.user.id,
          productId,
          rating,
          title,
          content,
        },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      // 상품 평점 및 리뷰 수 업데이트
      prisma.product.update({
        where: { id: productId },
        data: {
          reviewCount: { increment: 1 },
        },
      }),
    ]);

    // 평균 평점 재계산
    const avgRating = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: { averageRating: avgRating._avg.rating || 0 },
    });

    // 판매자에게 알림 생성
    await prisma.notification.create({
      data: {
        userId: product.sellerId,
        type: "REVIEW",
        title: "새로운 리뷰가 등록되었어요! ⭐",
        message: `${session.user.name || "사용자"}님이 "${product.title}"에 ${rating}점 리뷰를 남겼습니다.`,
        data: { productId, reviewId: review.id, rating },
      },
    });

    // 판매자에게 이메일 발송 (비동기)
    try {
      const seller = await prisma.user.findUnique({
        where: { id: product.sellerId },
        select: { name: true, email: true },
      });

      if (seller?.email) {
        await sendReviewNotificationEmail(seller.email, {
          sellerName: seller.name || "판매자",
          productTitle: product.title,
          rating,
          reviewerName: session.user.name || "사용자",
          reviewContent: content.length > 200 ? content.slice(0, 200) + "..." : content,
        });
      }
    } catch (emailError) {
      console.error("Review email sending failed:", emailError);
    }

    return NextResponse.json(
      { message: "리뷰가 등록되었습니다", review },
      { status: 201 }
    );
  } catch (error) {
    console.error("Review create error:", error);
    return NextResponse.json(
      { error: "리뷰 등록 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
