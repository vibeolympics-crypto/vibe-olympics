import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// 분석 통계 조회 (GET)
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
    const period = searchParams.get("period") || "30d";

    // 기간에 따른 날짜 계산
    const now = new Date();
    const startDate = new Date();
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // 이전 기간 (비교용)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // 내 상품 목록
    const myProducts = await prisma.product.findMany({
      where: { sellerId: session.user.id },
      select: { id: true },
    });
    const myProductIds = myProducts.map(p => p.id);

    // 현재 기간 판매 데이터
    const currentPurchases = await prisma.purchase.findMany({
      where: {
        productId: { in: myProductIds },
        status: "COMPLETED",
        createdAt: { gte: startDate },
      },
      include: {
        product: {
          select: { id: true, title: true, viewCount: true },
        },
      },
    });

    // 이전 기간 판매 데이터 (비교용)
    const previousPurchases = await prisma.purchase.findMany({
      where: {
        productId: { in: myProductIds },
        status: "COMPLETED",
        createdAt: { gte: previousStartDate, lt: startDate },
      },
    });

    // 총 수익 계산
    const currentRevenue = currentPurchases.reduce((sum, p) => sum + Number(p.amount), 0);
    const previousRevenue = previousPurchases.reduce((sum, p) => sum + Number(p.amount), 0);

    // 현재 기간 조회수
    const currentViews = await prisma.product.aggregate({
      where: {
        sellerId: session.user.id,
      },
      _sum: { viewCount: true },
    });

    // 신규 고객 (기간 내 첫 구매자)
    const uniqueBuyers = new Set(currentPurchases.map(p => p.buyerId));

    // 일별 수익 데이터
    const dailyRevenue: { date: string; revenue: number; sales: number }[] = [];
    const daysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < Math.min(daysInPeriod, 30); i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayPurchases = currentPurchases.filter(p => 
        p.createdAt.toISOString().split("T")[0] === dateStr
      );
      
      dailyRevenue.unshift({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        revenue: dayPurchases.reduce((sum, p) => sum + Number(p.amount), 0),
        sales: dayPurchases.length,
      });
    }

    // 상품별 성과
    const productStats = await Promise.all(
      myProducts.slice(0, 10).map(async ({ id }) => {
        const product = await prisma.product.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            viewCount: true,
            salesCount: true,
            _count: { select: { purchases: true } },
          },
        });

        const productPurchases = currentPurchases.filter(p => p.productId === id);
        const revenue = productPurchases.reduce((sum, p) => sum + Number(p.amount), 0);
        const views = product?.viewCount || 0;
        const sales = productPurchases.length;

        return {
          id,
          title: product?.title || "",
          revenue,
          sales,
          views,
          conversionRate: views > 0 ? (sales / views) * 100 : 0,
        };
      })
    );

    // 정렬: 수익 순
    productStats.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      stats: {
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
        },
        sales: {
          current: currentPurchases.length,
          previous: previousPurchases.length,
        },
        views: {
          current: currentViews._sum.viewCount || 0,
          previous: 0, // 조회수는 누적이므로 이전 값 계산이 복잡
        },
        customers: {
          current: uniqueBuyers.size,
          previous: new Set(previousPurchases.map(p => p.buyerId)).size,
        },
      },
      dailyRevenue,
      productPerformance: productStats.filter(p => p.title), // 빈 제목 제외
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
