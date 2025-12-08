import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 캐시 설정: 10분 (인기 태그/카테고리)
export const revalidate = 600;

interface ProductWithTags {
  tags: string[];
  salesCount: number;
}

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

// 인기 태그/검색어 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // 판매량 기준 상위 상품들의 태그 수집
    const topProducts = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
      },
      select: {
        tags: true,
        salesCount: true,
      },
      orderBy: {
        salesCount: "desc",
      },
      take: 50,
    }) as ProductWithTags[];

    // 태그별 등장 빈도 및 가중치 계산
    const tagScores: Record<string, number> = {};
    topProducts.forEach((product) => {
      product.tags.forEach((tag) => {
        if (!tagScores[tag]) {
          tagScores[tag] = 0;
        }
        // 판매량에 기반한 가중치 부여
        tagScores[tag] += 1 + (product.salesCount || 0) * 0.1;
      });
    });

    // 점수 기준으로 정렬하여 상위 N개 반환
    const popularTags = Object.entries(tagScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, score]) => ({
        tag,
        count: Math.round(score),
      }));

    // 인기 카테고리
    const popularCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                status: "PUBLISHED",
                isPublished: true,
              },
            },
          },
        },
      },
      orderBy: {
        products: {
          _count: "desc",
        },
      },
      take: 5,
    }) as CategoryWithCount[];

    return NextResponse.json(
      {
        tags: popularTags,
        categories: popularCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          productCount: cat._count.products,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error) {
    console.error("Popular tags error:", error);
    return NextResponse.json(
      { error: "인기 태그를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
