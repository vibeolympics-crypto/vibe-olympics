/**
 * 관리자 대시보드 확장 API
 * GET /api/admin/dashboard - 전체 통계, 매출, 환불률, 판매자 순위
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 관리자 권한 확인
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return adminCheck.error;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "month"; // day, week, month, year

    // 기간 설정
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 병렬로 모든 통계 조회
    const [
      // 기본 통계
      totalUsers,
      totalProducts,
      totalPurchases,
      
      // 기간별 신규
      newUsersInPeriod,
      newProductsInPeriod,
      purchasesInPeriod,
      
      // 매출 통계
      revenueData,
      
      // 환불 통계
      refundData,
      totalRefunds,
      
      // 판매자 순위
      topSellers,
      
      // 인기 상품
      topProducts,
      
      // 카테고리별 통계
      categoryStats,
      
      // 일별 추이 (최근 30일)
      dailyTrend,
      
      // 결제 수단별 통계
      paymentMethodStats,
      
      // 사용자 증가 추이
      userGrowth,
    ] = await Promise.all([
      // 전체 사용자 수
      prisma.user.count(),
      
      // 전체 상품 수
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      
      // 전체 구매 수
      prisma.purchase.count({ where: { status: "COMPLETED" } }),
      
      // 기간 내 신규 사용자
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      
      // 기간 내 신규 상품
      prisma.product.count({
        where: { createdAt: { gte: startDate }, status: "PUBLISHED" },
      }),
      
      // 기간 내 구매
      prisma.purchase.findMany({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        select: { amount: true },
      }),
      
      // 전체 매출 (완료된 구매)
      prisma.purchase.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      
      // 환불 통계
      prisma.refundRequest.findMany({
        where: { createdAt: { gte: startDate } },
        select: { status: true, amount: true },
      }),
      
      // 전체 환불 수
      prisma.refundRequest.count({
        where: { status: "COMPLETED" },
      }),
      
      // 판매자 순위 (매출 기준)
      prisma.user.findMany({
        where: {
          isSeller: true,
          products: { some: { purchases: { some: { status: "COMPLETED" } } } },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          totalRevenue: true,
          totalSales: true,
          _count: { select: { products: true } },
        },
        orderBy: { totalRevenue: "desc" },
        take: 10,
      }),
      
      // 인기 상품 (판매량 기준)
      prisma.product.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          price: true,
          salesCount: true,
          viewCount: true,
          thumbnail: true,
          seller: { select: { name: true } },
        },
        orderBy: { salesCount: "desc" },
        take: 10,
      }),
      
      // 카테고리별 매출
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          products: {
            where: { status: "PUBLISHED" },
            select: {
              _count: { select: { purchases: true } },
              purchases: {
                where: { status: "COMPLETED" },
                select: { amount: true },
              },
            },
          },
        },
      }),
      
      // 일별 매출 추이 (최근 30일)
      getDailyTrend(30),
      
      // 결제 수단별 통계
      prisma.purchase.groupBy({
        by: ["paymentMethod"],
        where: { status: "COMPLETED" },
        _count: true,
        _sum: { amount: true },
      }),
      
      // 사용자 증가 추이 (최근 12개월)
      getUserGrowthByMonth(12),
    ]);

    // 매출 계산
    const totalRevenue = Number(revenueData._sum.amount || 0);
    const periodRevenue = purchasesInPeriod.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    // 환불률 계산
    const completedRefunds = refundData.filter((r) => r.status === "COMPLETED");
    const pendingRefunds = refundData.filter((r) => r.status === "PENDING");
    const refundRate = totalPurchases > 0
      ? ((totalRefunds / totalPurchases) * 100).toFixed(2)
      : "0.00";
    const refundAmount = completedRefunds.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );

    // 카테고리별 통계 가공
    const processedCategoryStats = categoryStats.map((cat) => {
      const totalSales = cat.products.reduce(
        (sum, p) => sum + p._count.purchases,
        0
      );
      const totalCategoryRevenue = cat.products.reduce(
        (sum, p) => sum + p.purchases.reduce((s, pur) => s + Number(pur.amount), 0),
        0
      );
      return {
        id: cat.id,
        name: cat.name,
        productCount: cat.products.length,
        salesCount: totalSales,
        revenue: totalCategoryRevenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 결제 수단 통계 가공
    const processedPaymentStats = paymentMethodStats.map((pm) => ({
      method: pm.paymentMethod || "기타",
      count: pm._count,
      revenue: Number(pm._sum.amount || 0),
    }));

    return NextResponse.json({
      // 기본 통계
      overview: {
        totalUsers,
        totalProducts,
        totalPurchases,
        totalRevenue,
        totalRefunds,
      },
      
      // 기간별 통계
      period: {
        name: period,
        startDate: startDate.toISOString(),
        newUsers: newUsersInPeriod,
        newProducts: newProductsInPeriod,
        purchases: purchasesInPeriod.length,
        revenue: periodRevenue,
      },
      
      // 환불 통계
      refunds: {
        total: totalRefunds,
        pending: pendingRefunds.length,
        rate: parseFloat(refundRate),
        amount: refundAmount,
      },
      
      // 판매자 순위
      topSellers: topSellers.map((seller) => ({
        id: seller.id,
        name: seller.name,
        email: seller.email,
        image: seller.image,
        revenue: Number(seller.totalRevenue),
        sales: seller.totalSales,
        products: seller._count.products,
      })),
      
      // 인기 상품
      topProducts: topProducts.map((product) => ({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        sales: product.salesCount,
        views: product.viewCount,
        thumbnail: product.thumbnail,
        seller: product.seller?.name || "알 수 없음",
      })),
      
      // 카테고리별 통계
      categoryStats: processedCategoryStats,
      
      // 일별 추이
      dailyTrend,
      
      // 결제 수단 통계
      paymentMethodStats: processedPaymentStats,
      
      // 사용자 증가 추이
      userGrowth,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "대시보드 데이터를 가져오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 일별 매출 추이
async function getDailyTrend(days: number) {
  const results = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [purchases, revenue, refunds, users] = await Promise.all([
      prisma.purchase.count({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.purchase.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { amount: true },
      }),
      prisma.refundRequest.count({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
    ]);

    results.push({
      date: startOfDay.toISOString().split("T")[0],
      purchases,
      revenue: Number(revenue._sum.amount || 0),
      refunds,
      newUsers: users,
    });
  }

  return results;
}

// 월별 사용자 증가 추이
async function getUserGrowthByMonth(months: number) {
  const results = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const count = await prisma.user.count({
      where: {
        createdAt: { gte: date, lte: endOfMonth },
      },
    });

    results.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      users: count,
    });
  }

  return results;
}
