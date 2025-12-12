import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// ProductType 정의
const PRODUCT_TYPES = ["DIGITAL_PRODUCT", "BOOK", "VIDEO_SERIES", "MUSIC_ALBUM"] as const;
type ProductType = typeof PRODUCT_TYPES[number];

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
    const productTypeFilter = searchParams.get("productType") as ProductType | null;

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
    const periodDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    const previousEndDate = new Date(startDate);

    // 내 상품 목록 (productType 포함)
    const myProducts = await prisma.product.findMany({
      where: { 
        sellerId: session.user.id,
        ...(productTypeFilter && { productType: productTypeFilter }),
      },
      select: { id: true, productType: true, viewCount: true },
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
          select: { id: true, title: true, viewCount: true, productType: true },
        },
      },
    });

    // 이전 기간 판매 데이터 (비교용)
    const previousPurchases = await prisma.purchase.findMany({
      where: {
        productId: { in: myProductIds },
        status: "COMPLETED",
        createdAt: { gte: previousStartDate, lt: previousEndDate },
      },
      include: {
        product: {
          select: { id: true, productType: true },
        },
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

    // ===============================================
    // ProductType별 분석 데이터
    // ===============================================
    
    // ProductType별 매출/판매 집계
    const productTypeStats: Record<ProductType, { 
      revenue: number; 
      sales: number; 
      previousRevenue: number; 
      previousSales: number;
      viewCount: number;
    }> = {
      DIGITAL_PRODUCT: { revenue: 0, sales: 0, previousRevenue: 0, previousSales: 0, viewCount: 0 },
      BOOK: { revenue: 0, sales: 0, previousRevenue: 0, previousSales: 0, viewCount: 0 },
      VIDEO_SERIES: { revenue: 0, sales: 0, previousRevenue: 0, previousSales: 0, viewCount: 0 },
      MUSIC_ALBUM: { revenue: 0, sales: 0, previousRevenue: 0, previousSales: 0, viewCount: 0 },
    };

    // 현재 기간 ProductType별 집계
    currentPurchases.forEach(p => {
      const type = (p.product?.productType || "DIGITAL_PRODUCT") as ProductType;
      productTypeStats[type].revenue += Number(p.amount);
      productTypeStats[type].sales += 1;
    });

    // 이전 기간 ProductType별 집계
    previousPurchases.forEach(p => {
      const type = (p.product?.productType || "DIGITAL_PRODUCT") as ProductType;
      productTypeStats[type].previousRevenue += Number(p.amount);
      productTypeStats[type].previousSales += 1;
    });

    // 조회수 집계
    myProducts.forEach(p => {
      const type = (p.productType || "DIGITAL_PRODUCT") as ProductType;
      productTypeStats[type].viewCount += p.viewCount || 0;
    });

    // ProductType별 매출 파이차트 데이터
    const productTypeRevenue = PRODUCT_TYPES.map(type => ({
      productType: type,
      name: getProductTypeName(type),
      revenue: productTypeStats[type].revenue,
      sales: productTypeStats[type].sales,
      percentage: currentRevenue > 0 ? (productTypeStats[type].revenue / currentRevenue) * 100 : 0,
    })).filter(item => item.revenue > 0 || item.sales > 0);

    // ProductType별 성장률
    const productTypeGrowth = PRODUCT_TYPES.map(type => {
      const current = productTypeStats[type].revenue;
      const previous = productTypeStats[type].previousRevenue;
      const growth = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
      return {
        productType: type,
        name: getProductTypeName(type),
        current,
        previous,
        change: growth,
      };
    });

    // 일별 ProductType별 트렌드 데이터
    const dailyProductTypeTrend: { 
      date: string; 
      DIGITAL_PRODUCT: number; 
      BOOK: number; 
      VIDEO_SERIES: number; 
      MUSIC_ALBUM: number; 
    }[] = [];

    for (let i = 0; i < Math.min(periodDays, 30); i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayData: Record<ProductType, number> = {
        DIGITAL_PRODUCT: 0,
        BOOK: 0,
        VIDEO_SERIES: 0,
        MUSIC_ALBUM: 0,
      };

      currentPurchases
        .filter(p => p.createdAt.toISOString().split("T")[0] === dateStr)
        .forEach(p => {
          const type = (p.product?.productType || "DIGITAL_PRODUCT") as ProductType;
          dayData[type] += Number(p.amount);
        });

      dailyProductTypeTrend.unshift({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        ...dayData,
      });
    }

    // 주간 비교 데이터
    const weeklyProductTypeData: {
      period: string;
      DIGITAL_PRODUCT: number;
      BOOK: number;
      VIDEO_SERIES: number;
      MUSIC_ALBUM: number;
    }[] = [];

    const weeksToShow = Math.min(Math.ceil(periodDays / 7), 4);
    for (let w = 0; w < weeksToShow; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (w + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - w * 7);

      const weekData: Record<ProductType, number> = {
        DIGITAL_PRODUCT: 0,
        BOOK: 0,
        VIDEO_SERIES: 0,
        MUSIC_ALBUM: 0,
      };

      currentPurchases
        .filter(p => p.createdAt >= weekStart && p.createdAt < weekEnd)
        .forEach(p => {
          const type = (p.product?.productType || "DIGITAL_PRODUCT") as ProductType;
          weekData[type] += Number(p.amount);
        });

      weeklyProductTypeData.unshift({
        period: `${weeksToShow - w}주차`,
        ...weekData,
      });
    }

    // ProductType별 성과 레이더 데이터
    const maxRevenue = Math.max(...Object.values(productTypeStats).map(s => s.revenue), 1);
    const maxSales = Math.max(...Object.values(productTypeStats).map(s => s.sales), 1);
    const maxViews = Math.max(...Object.values(productTypeStats).map(s => s.viewCount), 1);

    const productTypePerformanceRadar = [
      {
        metric: "매출",
        ...Object.fromEntries(
          PRODUCT_TYPES.map(type => [type, (productTypeStats[type].revenue / maxRevenue) * 100])
        ),
        fullMark: 100,
      },
      {
        metric: "판매",
        ...Object.fromEntries(
          PRODUCT_TYPES.map(type => [type, (productTypeStats[type].sales / maxSales) * 100])
        ),
        fullMark: 100,
      },
      {
        metric: "조회수",
        ...Object.fromEntries(
          PRODUCT_TYPES.map(type => [type, (productTypeStats[type].viewCount / maxViews) * 100])
        ),
        fullMark: 100,
      },
      {
        metric: "성장률",
        ...Object.fromEntries(
          PRODUCT_TYPES.map(type => {
            const growth = productTypeGrowth.find(g => g.productType === type)?.change || 0;
            return [type, Math.min(Math.max(growth, -100), 100) + 100]; // -100% ~ 100% -> 0 ~ 200
          })
        ),
        fullMark: 200,
      },
    ];

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
      // ProductType별 분석 데이터
      productTypeAnalytics: {
        revenue: productTypeRevenue,
        growth: productTypeGrowth,
        dailyTrend: dailyProductTypeTrend,
        weeklyComparison: weeklyProductTypeData,
        performanceRadar: productTypePerformanceRadar,
        stats: Object.fromEntries(
          PRODUCT_TYPES.map(type => [
            type,
            {
              ...productTypeStats[type],
              growth: productTypeGrowth.find(g => g.productType === type)?.change || 0,
              conversionRate: productTypeStats[type].viewCount > 0 
                ? (productTypeStats[type].sales / productTypeStats[type].viewCount) * 100 
                : 0,
            },
          ])
        ),
      },
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ProductType 한글 이름
function getProductTypeName(type: ProductType): string {
  const names: Record<ProductType, string> = {
    DIGITAL_PRODUCT: "디지털 상품",
    BOOK: "도서",
    VIDEO_SERIES: "영상 시리즈",
    MUSIC_ALBUM: "음악 앨범",
  };
  return names[type];
}
