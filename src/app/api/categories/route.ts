import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 캐시 설정: 5분 (카테고리는 자주 변하지 않음)
export const revalidate = 300;

// 카테고리 목록 조회 (GET)
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

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
