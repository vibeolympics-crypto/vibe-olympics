import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// 팔로우한 판매자들의 최신 상품 피드 (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // 팔로우하는 판매자 ID 목록 가져오기
    const followingIds = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const sellerIds = followingIds.map((f) => f.followingId);

    if (sellerIds.length === 0) {
      return NextResponse.json({
        products: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // 팔로우한 판매자들의 최신 상품 조회
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          sellerId: { in: sellerIds },
          status: "PUBLISHED",
        },
        select: {
          id: true,
          title: true,
          shortDescription: true,
          thumbnail: true,
          price: true,
          originalPrice: true,
          pricingType: true,
          averageRating: true,
          reviewCount: true,
          salesCount: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          seller: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({
        where: {
          sellerId: { in: sellerIds },
          status: "PUBLISHED",
        },
      }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Following feed error:", error);
    return NextResponse.json(
      { error: "피드를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
