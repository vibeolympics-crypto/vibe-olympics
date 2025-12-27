/**
 * 판매자 상품 통계 API
 * GET /api/dashboard/product-stats - 상품별 조회수/판매 통계
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withSecurity } from "@/lib/security";

export const dynamic = 'force-dynamic';

async function handleGET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "month"; // week, month, year

    // 기간 계산
    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getFullYear(), 0, 1);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getFullYear(), prevEndDate.getMonth(), 1);
    }

    // 판매자 상품 조회
    const products = await prisma.product.findMany({
      where: {
        sellerId: session.user.id,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        price: true,
        viewCount: true,
        salesCount: true,
        purchases: {
          where: {
            status: "COMPLETED",
            createdAt: { gte: startDate },
          },
          select: { amount: true },
        },
      },
    });

    // 이전 기간 판매 데이터 조회
    const prevPurchases = await prisma.purchase.groupBy({
      by: ["productId"],
      where: {
        status: "COMPLETED",
        createdAt: { gte: prevStartDate, lte: prevEndDate },
        product: { sellerId: session.user.id },
      },
      _count: true,
      _sum: { amount: true },
    });
    const prevPurchaseMap = new Map<string | null, { count: number; revenue: number }>(
      prevPurchases.map((p) => [p.productId, { count: p._count, revenue: Number(p._sum.amount || 0) }])
    );

    // 상품별 통계 가공
    const productStats = products.map((product) => {
      const currentSales = product.purchases.length;
      const currentRevenue = product.purchases.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const prevData = prevPurchaseMap.get(product.id);
      const prevSales = prevData?.count || 0;

      // 전환율 계산 (조회수 대비 판매)
      const conversionRate = product.viewCount > 0
        ? (product.salesCount / product.viewCount) * 100
        : 0;

      // 트렌드 계산 (이전 기간 대비 변화율)
      const salesTrend = prevSales > 0
        ? Math.round(((currentSales - prevSales) / prevSales) * 100)
        : currentSales > 0 ? 100 : 0;

      return {
        id: product.id,
        title: product.title,
        thumbnail: product.thumbnail,
        price: Number(product.price),
        viewCount: product.viewCount,
        salesCount: product.salesCount,
        conversionRate,
        revenue: currentRevenue,
        trend: {
          views: 0, // 조회수 트렌드는 별도 로직 필요
          sales: salesTrend,
        },
      };
    });

    // 요약 통계
    const summary = {
      totalViews: products.reduce((sum, p) => sum + p.viewCount, 0),
      totalSales: productStats.reduce((sum, p) => sum + p.salesCount, 0),
      totalRevenue: productStats.reduce((sum, p) => sum + p.revenue, 0),
      avgConversionRate: productStats.length > 0
        ? productStats.reduce((sum, p) => sum + p.conversionRate, 0) / productStats.length
        : 0,
    };

    return NextResponse.json({
      products: productStats,
      summary,
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Product stats error:", error);
    return NextResponse.json(
      { error: "상품 통계 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withSecurity(request, handleGET, { rateLimit: 'api' });
}
