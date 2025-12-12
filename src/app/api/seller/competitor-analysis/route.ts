/**
 * 경쟁 상품 분석 API
 * GET - 경쟁 분석 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  analyzeCompetitors,
  findSimilarProducts,
  getCategoryPriceStats,
} from "@/lib/competitor-analysis";

export const dynamic = "force-dynamic";

// GET: 경쟁 분석 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const action = searchParams.get("action");

    // 판매자 권한 체크
    const isSeller = (session.user as { isSeller?: boolean })?.isSeller ?? false;
    if (session.user.role !== "ADMIN" && !isSeller) {
      return NextResponse.json(
        { error: "판매자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 상품 ID 필수
    if (!productId) {
      return NextResponse.json(
        { error: "상품 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 상품 소유권 확인
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { sellerId: true, categoryId: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (session.user.role !== "ADMIN" && product.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 유사 상품만 조회
    if (action === "similar") {
      const limit = parseInt(searchParams.get("limit") || "10", 10);
      const similar = await findSimilarProducts(productId, limit);
      return NextResponse.json({ success: true, data: similar });
    }

    // 카테고리 가격 통계
    if (action === "priceStats") {
      const stats = await getCategoryPriceStats(product.categoryId);
      return NextResponse.json({ success: true, data: stats });
    }

    // 전체 경쟁 분석
    const analysis = await analyzeCompetitors(productId);
    
    if (!analysis) {
      return NextResponse.json(
        { error: "분석을 수행할 수 없습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error("Competitor analysis error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
