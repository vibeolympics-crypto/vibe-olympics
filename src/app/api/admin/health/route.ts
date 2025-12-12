/**
 * Server Health Monitoring API
 * 서버 상태 모니터링 API
 * 
 * Phase 11 - 서버 헬스 모니터링
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  recordApiCall, 
  recordError, 
  getMetrics, 
  calculateStats, 
  getEndpointStats, 
  getTimeSlotStats 
} from "@/lib/server-metrics";

export const dynamic = 'force-dynamic';

// GET: 헬스 메트릭 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 관리자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "1h"; // 1h, 6h, 24h, 7d

    // 기간 계산
    const periodMs: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };

    const since = Date.now() - (periodMs[period] || periodMs["1h"]);
    const { apiCalls: recentCalls, errors: recentErrors } = getMetrics(since);

    // 통계 계산
    const summary = calculateStats(recentCalls);
    const endpointStats = getEndpointStats(recentCalls);
    const callsByTime = getTimeSlotStats(recentCalls, since, 12);

    // DB 상태 확인
    let dbStatus = "healthy";
    let dbLatency = 0;
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = "unhealthy";
    }

    // 메모리 사용량 (Node.js)
    const memoryUsage = process.memoryUsage();

    // DB 통계
    const [userCount, productCount, purchaseCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.purchase.count(),
    ]);

    return NextResponse.json({
      status: dbStatus === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      period,
      
      // 요약 통계
      summary,
      
      // DB 상태
      database: {
        status: dbStatus,
        latency: dbLatency,
        records: {
          users: userCount,
          products: productCount,
          purchases: purchaseCount,
        },
      },
      
      // 메모리
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      
      // 시간대별 차트 데이터
      callsByTime,
      
      // 엔드포인트별 통계 (상위 10개)
      topEndpoints: Object.entries(endpointStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([endpoint, stats]) => ({
          endpoint,
          ...stats,
        })),
      
      // 최근 에러
      recentErrors: recentErrors.slice(-20).reverse(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "헬스 체크 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 메트릭 기록 (내부용)
export async function POST(request: NextRequest) {
  try {
    // 내부 API 키 확인 (선택적)
    const apiKey = request.headers.get("x-internal-api-key");
    if (process.env.INTERNAL_API_KEY && apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, endpoint, duration, status, message } = body;

    if (type === "api_call" && endpoint && duration !== undefined && status !== undefined) {
      recordApiCall(endpoint, duration, status);
    } else if (type === "error" && endpoint && message) {
      recordError(endpoint, message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Metric recording error:", error);
    return NextResponse.json({ error: "메트릭 기록 실패" }, { status: 500 });
  }
}
