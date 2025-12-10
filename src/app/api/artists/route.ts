import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateSlug } from "@/lib/seo-utils";

// 프로필 업데이트 스키마
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(1000).optional(),
  artistType: z.string().max(50).optional(),
  specialties: z.array(z.string()).max(10).optional(),
  location: z.string().max(100).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  github: z.string().max(50).optional(),
  twitter: z.string().max(50).optional(),
  instagram: z.string().max(50).optional(),
  youtube: z.string().max(100).optional(),
  linkedin: z.string().max(100).optional(),
  soundcloud: z.string().max(100).optional(),
  behance: z.string().max(100).optional(),
});

// GET: 아티스트 프로필 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const userId = searchParams.get("userId");
    const featured = searchParams.get("featured") === "true";
    const artistType = searchParams.get("artistType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // 단일 프로필 조회
    if (slug || userId) {
      const where = slug ? { slug } : { id: userId };
      
      const user = await prisma.user.findUnique({
        where: where as { slug: string } | { id: string },
        select: {
          id: true,
          name: true,
          displayName: true,
          slug: true,
          image: true,
          coverImage: true,
          bio: true,
          artistType: true,
          specialties: true,
          location: true,
          website: true,
          github: true,
          twitter: true,
          instagram: true,
          youtube: true,
          linkedin: true,
          soundcloud: true,
          behance: true,
          isSeller: true,
          sellerVerified: true,
          isVerifiedArtist: true,
          totalSales: true,
          createdAt: true,
          _count: {
            select: {
              products: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "프로필을 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      // 추가 통계 조회
      const [productStats, reviewStats] = await Promise.all([
        prisma.product.aggregate({
          where: { sellerId: user.id, isPublished: true },
          _avg: { averageRating: true },
          _sum: { salesCount: true, viewCount: true },
        }),
        prisma.review.aggregate({
          where: { 
            product: { sellerId: user.id } 
          },
          _count: true,
          _avg: { rating: true },
        }),
      ]);

      // 최근 상품 목록
      const recentProducts = await prisma.product.findMany({
        where: { sellerId: user.id, isPublished: true },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          productType: true,
          price: true,
          averageRating: true,
          salesCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      });

      // 인기 상품 목록
      const popularProducts = await prisma.product.findMany({
        where: { sellerId: user.id, isPublished: true },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          productType: true,
          price: true,
          averageRating: true,
          salesCount: true,
        },
        orderBy: { salesCount: "desc" },
        take: 4,
      });

      // 컬렉션 목록
      const collections = await prisma.collection.findMany({
        where: { sellerId: user.id, isPublished: true },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          type: true,
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      });

      return NextResponse.json({
        profile: {
          ...user,
          stats: {
            productCount: user._count.products,
            followerCount: user._count.followers,
            followingCount: user._count.following,
            totalSales: productStats._sum.salesCount || 0,
            totalViews: productStats._sum.viewCount || 0,
            averageRating: productStats._avg.averageRating || 0,
            reviewCount: reviewStats._count || 0,
          },
        },
        recentProducts: recentProducts.map(p => ({
          ...p,
          price: Number(p.price),
        })),
        popularProducts: popularProducts.map(p => ({
          ...p,
          price: Number(p.price),
        })),
        collections: collections.map(c => ({
          ...c,
          itemCount: c._count.items,
        })),
      });
    }

    // 아티스트 목록 조회
    const where: Record<string, unknown> = {
      isSeller: true,
      products: { some: { isPublished: true } },
    };

    if (featured) {
      where.isVerifiedArtist = true;
    }

    if (artistType) {
      where.artistType = artistType;
    }

    const [artists, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          displayName: true,
          slug: true,
          image: true,
          coverImage: true,
          bio: true,
          artistType: true,
          specialties: true,
          isVerifiedArtist: true,
          totalSales: true,
          _count: {
            select: {
              products: { where: { isPublished: true } },
              followers: true,
            },
          },
        },
        orderBy: { totalSales: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      artists: artists.map(a => ({
        ...a,
        productCount: a._count.products,
        followerCount: a._count.followers,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Artist profile GET error:", error);
    return NextResponse.json(
      { error: "프로필 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 프로필 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "입력 데이터가 유효하지 않습니다", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // slug 자동 생성 (displayName이나 name 기반)
    let slug: string | undefined;
    if (data.displayName) {
      slug = generateSlug(data.displayName);
      // 중복 체크
      const existingSlug = await prisma.user.findFirst({
        where: { slug, id: { not: session.user.id } },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...data,
        slug: slug || undefined,
        coverImage: data.coverImage || null,
        website: data.website || null,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        slug: true,
        image: true,
        coverImage: true,
        bio: true,
        artistType: true,
        specialties: true,
        location: true,
        website: true,
        github: true,
        twitter: true,
        instagram: true,
        youtube: true,
        linkedin: true,
        soundcloud: true,
        behance: true,
        isVerifiedArtist: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Artist profile PATCH error:", error);
    return NextResponse.json(
      { error: "프로필 업데이트 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
