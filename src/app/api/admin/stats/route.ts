import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAdminStats } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { withSecurity, securityLogger } from "@/lib/security";

export const dynamic = 'force-dynamic';

async function handleGET(req: NextRequest): Promise<NextResponse> {
  // 관리자 권한 확인
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  // 관리자 액션 로깅
  securityLogger.log({
    type: 'SUSPICIOUS_ACTIVITY',
    severity: 'medium',
    userId: adminCheck.userId,
    ...securityLogger.extractContext(req),
    details: { action: 'ADMIN_VIEW_STATS', endpoint: req.nextUrl.pathname },
  });

  try {
    const stats = await getAdminStats();

    // 최근 7일간 일별 통계
    const dailyStats = await getDailyStats(7);

    // 카테고리별 상품 수
    const categoryStats = await prisma.category.findMany({
      select: {
        name: true,
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({
      ...stats,
      dailyStats,
      categoryStats: categoryStats.map((cat) => ({
        name: cat.name,
        count: cat._count.products,
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "통계 데이터를 가져오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withSecurity(request, handleGET, { rateLimit: 'api' });
}

async function getDailyStats(days: number) {
  const results: { date: string; users: number; products: number; sales: number }[] = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [users, products, sales] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.product.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.purchase.count({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
    ]);

    results.push({
      date: startOfDay.toISOString().split("T")[0],
      users,
      products,
      sales,
    });
  }

  return results;
}
