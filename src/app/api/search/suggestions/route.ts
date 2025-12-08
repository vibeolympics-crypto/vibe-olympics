import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ProductWithCategory {
  id: string;
  title: string;
  thumbnail: string | null;
  price: number | { toNumber: () => number };
  tags: string[];
  category: { name: string } | null;
}

// 검색 자동완성 (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [], tags: [] });
    }

    // 상품 제목에서 검색어와 일치하는 것 찾기
    const products = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { tags: { hasSome: [query.toLowerCase()] } },
        ],
      },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        price: true,
        tags: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: {
        salesCount: "desc",
      },
    }) as ProductWithCategory[];

    // 태그에서 매칭되는 것 찾기
    const allProducts = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
      },
      select: {
        tags: true,
      },
    }) as { tags: string[] }[];

    // 모든 태그를 수집하고 검색어와 매칭되는 것 필터링
    const allTags = new Set<string>();
    allProducts.forEach((p) => {
      p.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          allTags.add(tag);
        }
      });
    });

    const matchingTags = Array.from(allTags).slice(0, 5);

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        thumbnail: p.thumbnail,
        price: typeof p.price === "object" && "toNumber" in p.price ? p.price.toNumber() : Number(p.price),
        category: p.category?.name,
      })),
      tags: matchingTags,
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json(
      { error: "검색 제안을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
