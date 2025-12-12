import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface ProductWithCategory {
  id: string;
  title: string;
  thumbnail: string | null;
  price: number | { toNumber: () => number };
  tags: string[];
  category: { name: string; slug: string } | null;
}

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

// 검색 자동완성 (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [], tags: [], categories: [] });
    }

    // 1. 상품 검색 (병렬 실행)
    const productsPromise = prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { tags: { hasSome: [query.toLowerCase()] } },
          { description: { contains: query, mode: "insensitive" } },
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
            slug: true,
          },
        },
      },
      take: limit,
      orderBy: {
        salesCount: "desc",
      },
    }) as Promise<ProductWithCategory[]>;

    // 2. 카테고리 검색 (병렬 실행)
    const categoriesPromise = prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query.toLowerCase() } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { products: true },
        },
      },
      take: 5,
      orderBy: {
        products: {
          _count: "desc",
        },
      },
    }) as Promise<CategoryWithCount[]>;

    // 3. 태그 검색용 상품 조회 (병렬 실행)
    const tagsPromise = prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
      },
      select: {
        tags: true,
      },
    }) as Promise<{ tags: string[] }[]>;

    // 병렬 실행
    const [products, categories, allProducts] = await Promise.all([
      productsPromise,
      categoriesPromise,
      tagsPromise,
    ]);

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
        categorySlug: p.category?.slug,
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
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
