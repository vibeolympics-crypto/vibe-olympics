import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

// 판매자 공개 프로필 조회 (GET)
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    // 판매자 정보 조회
    const seller = await prisma.user.findUnique({
      where: { 
        id,
        isSeller: true, // 판매자만 조회 가능
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        website: true,
        github: true,
        twitter: true,
        createdAt: true,
        totalSales: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "판매자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 판매자의 상품 수 조회
    const productCount = await prisma.product.count({
      where: {
        sellerId: id,
        status: "PUBLISHED",
      },
    });

    // 판매자의 상품 목록 조회
    const products = await prisma.product.findMany({
      where: {
        sellerId: id,
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
        category: {
          select: { id: true, name: true, slug: true },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    // 판매자 통계 계산
    const stats = await prisma.product.aggregate({
      where: {
        sellerId: id,
        status: "PUBLISHED",
      },
      _sum: {
        salesCount: true,
      },
      _avg: {
        averageRating: true,
      },
    });

    // 총 리뷰 수
    const totalReviews = await prisma.review.count({
      where: {
        product: {
          sellerId: id,
        },
      },
    });

    // 팔로워 수
    const followerCount = await prisma.follow.count({
      where: { followingId: id },
    });

    // 응답 데이터
    const response = {
      seller: {
        id: seller.id,
        name: seller.name || "익명 판매자",
        image: seller.image,
        bio: seller.bio,
        website: seller.website,
        github: seller.github,
        twitter: seller.twitter,
        joinedAt: seller.createdAt,
        productCount,
        totalSales: seller.totalSales,
        followerCount,
      },
      stats: {
        totalSales: stats._sum.salesCount || 0,
        averageRating: stats._avg.averageRating || 0,
        totalReviews,
      },
      products,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Seller profile error:", error);
    return NextResponse.json(
      { error: "판매자 정보를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
