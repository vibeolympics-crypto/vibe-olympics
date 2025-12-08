import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 내가 팔로우하는 판매자 목록 조회 (GET)
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

    // 팔로잉 목록 조회
    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: session.user.id },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              image: true,
              bio: true,
              isSeller: true,
              createdAt: true,
              _count: {
                select: {
                  products: {
                    where: { status: "PUBLISHED" },
                  },
                  followers: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.follow.count({
        where: { followerId: session.user.id },
      }),
    ]);

    // 각 판매자의 평균 평점 계산
    const sellersWithStats = await Promise.all(
      following.map(async (f) => {
        const stats = await prisma.product.aggregate({
          where: {
            sellerId: f.following.id,
            status: "PUBLISHED",
          },
          _avg: { averageRating: true },
          _sum: { salesCount: true },
        });

        return {
          id: f.following.id,
          name: f.following.name || "익명 판매자",
          image: f.following.image,
          bio: f.following.bio,
          isSeller: f.following.isSeller,
          joinedAt: f.following.createdAt,
          followedAt: f.createdAt,
          productCount: f.following._count.products,
          followerCount: f.following._count.followers,
          averageRating: stats._avg.averageRating || 0,
          totalSales: stats._sum.salesCount || 0,
        };
      })
    );

    return NextResponse.json({
      following: sellersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Following list error:", error);
    return NextResponse.json(
      { error: "팔로잉 목록을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
