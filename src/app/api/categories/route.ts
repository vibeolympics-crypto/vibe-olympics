import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 캐시 설정: 5분 (카테고리는 자주 변하지 않음)
export const revalidate = 300;

// 카테고리 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get("productType");
    const includeChildren = searchParams.get("includeChildren") === "true";
    const parentId = searchParams.get("parentId");

    // 필터 조건 구성
    const where: Record<string, unknown> = {};
    
    // 상품 타입 필터
    if (productType) {
      where.productType = productType;
    }
    
    // 부모 카테고리 필터 (최상위 또는 특정 부모)
    if (parentId === "null" || parentId === "root") {
      where.parentId = null; // 최상위 카테고리만
    } else if (parentId) {
      where.parentId = parentId;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
        // 하위 카테고리 포함 (옵션)
        ...(includeChildren ? {
          children: {
            orderBy: { sortOrder: "asc" as const },
            include: {
              _count: {
                select: { products: true },
              },
            },
          },
        } : {}),
      },
    });

    // 상품 타입별 그룹화 옵션
    const groupByType = searchParams.get("groupByType") === "true";
    
    if (groupByType) {
      const grouped: Record<string, typeof categories> = {
        DIGITAL_PRODUCT: [],
        BOOK: [],
        VIDEO_SERIES: [],
        MUSIC_ALBUM: [],
      };
      
      categories.forEach(cat => {
        const type = (cat as unknown as { productType: string }).productType || "DIGITAL_PRODUCT";
        if (grouped[type]) {
          grouped[type].push(cat);
        }
      });
      
      return NextResponse.json(
        { categories, grouped },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    return NextResponse.json(
      { categories },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json(
      { error: "카테고리를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
