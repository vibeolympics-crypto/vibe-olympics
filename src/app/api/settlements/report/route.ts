/**
 * 정산 상세 리포트 API
 * GET /api/settlements/report - 기간별 상세 리포트
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "month"; // week, month, quarter, year
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    // 판매자/관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isSeller: true },
    });

    if (!user || (!user.isSeller && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "판매자만 이용 가능합니다." }, { status: 403 });
    }

    const isAdmin = user.role === "ADMIN";

    // 기간 계산
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "week":
        // 이번 주 (월요일 ~ 일요일)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + mondayOffset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case "quarter":
        // 분기
        const quarter = Math.ceil(month / 3);
        startDate = new Date(year, (quarter - 1) * 3, 1);
        endDate = new Date(year, quarter * 3, 0, 23, 59, 59, 999);
        break;
      
      case "year":
        // 연간
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        break;
      
      case "month":
      default:
        // 월간
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
    }

    // 판매자 조건
    const sellerCondition = isAdmin ? {} : { sellerId: session.user.id };

    // 병렬로 데이터 조회
    const [
      // 정산 내역
      settlements,
      
      // 기간 내 판매 내역
      purchases,
      
      // 기간 내 환불
      refunds,
      
      // 상품별 판매 통계
      productStats,
      
      // 일별 매출
      dailyRevenue,
    ] = await Promise.all([
      // 정산 내역
      prisma.settlement.findMany({
        where: {
          ...sellerCondition,
          OR: [
            { periodStart: { gte: startDate, lte: endDate } },
            { periodEnd: { gte: startDate, lte: endDate } },
          ],
        },
        include: {
          settlementItems: {
            include: {
              purchase: {
                include: {
                  product: { select: { id: true, title: true } },
                  buyer: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { periodStart: "desc" },
      }),
      
      // 판매 내역
      prisma.purchase.findMany({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate, lte: endDate },
          product: isAdmin ? {} : { sellerId: session.user.id },
        },
        include: {
          product: { select: { id: true, title: true, sellerId: true } },
          buyer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      
      // 환불 내역
      prisma.refundRequest.findMany({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate, lte: endDate },
          purchase: {
            product: isAdmin ? {} : { sellerId: session.user.id },
          },
        },
        include: {
          purchase: {
            include: {
              product: { select: { title: true } },
            },
          },
        },
      }),
      
      // 상품별 통계
      prisma.purchase.groupBy({
        by: ["productId"],
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate, lte: endDate },
          product: isAdmin ? {} : { sellerId: session.user.id },
        },
        _count: true,
        _sum: { amount: true },
      }),
      
      // 일별 매출
      getDailyRevenue(startDate, endDate, isAdmin ? undefined : session.user.id),
    ]);

    // 상품 정보 조회 (상품별 통계용)
    const productIds = productStats.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, price: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 통계 계산
    const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalSettled = settlements
      .filter((s) => s.status === "COMPLETED")
      .reduce((sum, s) => sum + Number(s.netAmount), 0);
    const pendingSettlement = settlements
      .filter((s) => ["PENDING", "READY", "PROCESSING"].includes(s.status))
      .reduce((sum, s) => sum + Number(s.netAmount), 0);

    // 플랫폼 수수료 합계
    const totalPlatformFee = settlements.reduce((sum, s) => sum + Number(s.platformFee), 0);
    const totalPaymentFee = settlements.reduce((sum, s) => sum + Number(s.paymentFee), 0);

    return NextResponse.json({
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        label: getPeriodLabel(period, startDate, endDate),
      },
      
      summary: {
        totalRevenue,
        totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
        totalSettled,
        pendingSettlement,
        platformFee: totalPlatformFee,
        paymentFee: totalPaymentFee,
        salesCount: purchases.length,
        refundCount: refunds.length,
        refundRate: purchases.length > 0
          ? ((refunds.length / purchases.length) * 100).toFixed(2)
          : "0.00",
      },
      
      settlements: settlements.map((s) => ({
        id: s.id,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
        totalSales: Number(s.totalSales),
        salesCount: s.salesCount,
        platformFee: Number(s.platformFee),
        paymentFee: Number(s.paymentFee),
        netAmount: Number(s.netAmount),
        status: s.status,
        paidAt: s.paidAt,
        items: s.settlementItems.map((item) => ({
          id: item.id,
          productTitle: item.purchase.product.title,
          buyerName: item.purchase.buyer?.name || "알 수 없음",
          amount: Number(item.amount),
          fee: Number(item.platformFee),
          createdAt: item.createdAt,
        })),
      })),
      
      productStats: productStats
        .map((ps) => {
          const product = productMap.get(ps.productId);
          return {
            productId: ps.productId,
            title: product?.title || "알 수 없음",
            price: Number(product?.price || 0),
            salesCount: ps._count,
            revenue: Number(ps._sum.amount || 0),
          };
        })
        .sort((a, b) => b.revenue - a.revenue),
      
      dailyRevenue,
      
      recentSales: purchases.slice(0, 20).map((p) => ({
        id: p.id,
        productTitle: p.product.title,
        buyerName: p.buyer?.name || "알 수 없음",
        price: Number(p.amount),
        createdAt: p.createdAt,
      })),
      
      recentRefunds: refunds.map((r) => ({
        id: r.id,
        productTitle: r.purchase.product.title,
        amount: Number(r.amount),
        reason: r.reason,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Settlement report error:", error);
    return NextResponse.json(
      { error: "정산 리포트 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 일별 매출 조회
async function getDailyRevenue(
  startDate: Date,
  endDate: Date,
  sellerId?: string
) {
  const results = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayStart = new Date(current);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const purchases = await prisma.purchase.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: dayStart, lte: dayEnd },
        ...(sellerId ? { product: { sellerId } } : {}),
      },
      _sum: { amount: true },
      _count: true,
    });

    results.push({
      date: dayStart.toISOString().split("T")[0],
      revenue: Number(purchases._sum.amount || 0),
      count: purchases._count,
    });

    current.setDate(current.getDate() + 1);
  }

  return results;
}

// 기간 라벨 생성
function getPeriodLabel(period: string, start: Date, end: Date): string {
  const format = (d: Date) => d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  switch (period) {
    case "week":
      return `${format(start)} ~ ${format(end)}`;
    case "quarter":
      const quarter = Math.ceil((start.getMonth() + 1) / 3);
      return `${start.getFullYear()}년 ${quarter}분기`;
    case "year":
      return `${start.getFullYear()}년`;
    case "month":
    default:
      return `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
  }
}
